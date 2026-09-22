// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title PackageRegistry
/// @notice Stores NPM package provenance records (name, version, hash, source)
///         so later downloads can be checked against an immutable on-chain hash.
contract PackageRegistry {
    struct PackageRecord {
        string packageName;
        string version;
        string packageHash;
        string source;
        address publisher;
        uint256 timestamp;
    }

    address public immutable owner;

    /// @dev keccak256(name + "|" + version) → record
    mapping(bytes32 => PackageRecord) private records;

    /// @dev Separate flag so we can tell "never registered" from a zeroed struct.
    mapping(bytes32 => bool) private registered;

    /// @dev keccak256(packageName) → versions in registration order
    mapping(bytes32 => string[]) private versionsByPackage;

    mapping(address => bool) public authorizedPublishers;

    event PackageRegistered(
        string packageName,
        string version,
        string packageHash,
        string source,
        address indexed publisher,
        uint256 timestamp
    );

    event PublisherAuthorized(address indexed publisher);
    event PublisherRevoked(address indexed publisher);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedPublishers[msg.sender] = true;
        emit PublisherAuthorized(msg.sender);
    }

    /// @dev Separator stops collisions such as ("express", "1.0") vs ("expres", "s1.0").
    function _recordKey(
        string memory packageName,
        string memory version
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(packageName, "|", version));
    }

    function _nameKey(
        string memory packageName
    ) internal pure returns (bytes32) {
        return keccak256(bytes(packageName));
    }

    function authorizePublisher(address publisher) external onlyOwner {
        require(publisher != address(0), "Zero address");
        require(!authorizedPublishers[publisher], "Already authorized");

        authorizedPublishers[publisher] = true;
        emit PublisherAuthorized(publisher);
    }

    function revokePublisher(address publisher) external onlyOwner {
        require(authorizedPublishers[publisher], "Not authorized");
        require(publisher != owner, "Cannot revoke owner");

        authorizedPublishers[publisher] = false;
        emit PublisherRevoked(publisher);
    }

    /// @notice Register one package name + version. Publisher and timestamp are set on-chain.
    function registerPackage(
        string calldata packageName,
        string calldata version,
        string calldata packageHash,
        string calldata source
    ) external {
        require(authorizedPublishers[msg.sender], "Not authorized");
        require(bytes(packageName).length > 0, "Package name required");
        require(bytes(version).length > 0, "Version required");
        require(bytes(packageHash).length > 0, "Package hash required");
        require(bytes(source).length > 0, "Source required");

        bytes32 key = _recordKey(packageName, version);
        require(!registered[key], "Package version already registered");

        records[key] = PackageRecord({
            packageName: packageName,
            version: version,
            packageHash: packageHash,
            source: source,
            publisher: msg.sender,
            timestamp: block.timestamp
        });
        registered[key] = true;
        versionsByPackage[_nameKey(packageName)].push(version);

        emit PackageRegistered(
            packageName,
            version,
            packageHash,
            source,
            msg.sender,
            block.timestamp
        );
    }

    /// @notice Return the stored record for a name + version.
    function getPackage(
        string calldata packageName,
        string calldata version
    ) external view returns (PackageRecord memory) {
        bytes32 key = _recordKey(packageName, version);
        require(registered[key], "Package version not registered");
        return records[key];
    }

    /// @notice Versions registered for a package name, in registration order.
    function getPackageHistory(
        string calldata packageName
    ) external view returns (string[] memory) {
        require(bytes(packageName).length > 0, "Package name required");
        return versionsByPackage[_nameKey(packageName)];
    }

    /// @notice Compare a caller-supplied hash with the hash stored on chain.
    /// @return True if the hashes match; false if they differ. Reverts if unregistered.
    function verifyPackage(
        string calldata packageName,
        string calldata version,
        string calldata currentHash
    ) external view returns (bool) {
        bytes32 key = _recordKey(packageName, version);
        require(registered[key], "Package version not registered");
        return
            keccak256(bytes(records[key].packageHash)) ==
            keccak256(bytes(currentHash));
    }
}
