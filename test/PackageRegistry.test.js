const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PackageRegistry", function () {
  const sample = {
    name: "express",
    version: "4.21.0",
    hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    source: "npm",
  };

  async function deployRegistry() {
    const [owner, other] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("PackageRegistry");
    const registry = await Factory.deploy();
    await registry.waitForDeployment();
    return { registry, owner, other };
  }

  it("registers a package and stores publisher, timestamp, and fields", async function () {
    const { registry, owner } = await deployRegistry();

    await registry.registerPackage(
      sample.name,
      sample.version,
      sample.hash,
      sample.source
    );

    const record = await registry.getPackage(sample.name, sample.version);

    expect(record.packageName).to.equal(sample.name);
    expect(record.version).to.equal(sample.version);
    expect(record.packageHash).to.equal(sample.hash);
    expect(record.source).to.equal(sample.source);
    expect(record.publisher).to.equal(owner.address);
    expect(record.timestamp).to.be.gt(0);
  });

  it("emits PackageRegistered on successful registration", async function () {
    const { registry, owner } = await deployRegistry();

    const tx = await registry.registerPackage(
      sample.name,
      sample.version,
      sample.hash,
      sample.source
    );
    const receipt = await tx.wait();
    const block = await ethers.provider.getBlock(receipt.blockNumber);

    await expect(tx)
      .to.emit(registry, "PackageRegistered")
      .withArgs(
        sample.name,
        sample.version,
        sample.hash,
        sample.source,
        owner.address,
        block.timestamp
      );
  });

  it("reverts when the same package name and version are registered twice", async function () {
    const { registry } = await deployRegistry();

    await registry.registerPackage(
      sample.name,
      sample.version,
      sample.hash,
      sample.source
    );

    await expect(
      registry.registerPackage(
        sample.name,
        sample.version,
        sample.hash,
        sample.source
      )
    ).to.be.revertedWith("Package version already registered");
  });

  it("reverts on empty package name, version, hash, or source", async function () {
    const { registry } = await deployRegistry();

    await expect(
      registry.registerPackage("", sample.version, sample.hash, sample.source)
    ).to.be.revertedWith("Package name required");

    await expect(
      registry.registerPackage(sample.name, "", sample.hash, sample.source)
    ).to.be.revertedWith("Version required");

    await expect(
      registry.registerPackage(sample.name, sample.version, "", sample.source)
    ).to.be.revertedWith("Package hash required");

    await expect(
      registry.registerPackage(sample.name, sample.version, sample.hash, "")
    ).to.be.revertedWith("Source required");
  });

  it("verifyPackage returns true when the hash matches", async function () {
    const { registry } = await deployRegistry();

    await registry.registerPackage(
      sample.name,
      sample.version,
      sample.hash,
      sample.source
    );

    expect(
      await registry.verifyPackage(sample.name, sample.version, sample.hash)
    ).to.equal(true);
  });

  it("verifyPackage returns false when the hash does not match", async function () {
    const { registry } = await deployRegistry();

    await registry.registerPackage(
      sample.name,
      sample.version,
      sample.hash,
      sample.source
    );

    const tamperedHash =
      "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

    expect(
      await registry.verifyPackage(sample.name, sample.version, tamperedHash)
    ).to.equal(false);
  });

  it("getPackage and verifyPackage revert for an unregistered package", async function () {
    const { registry } = await deployRegistry();

    await expect(registry.getPackage("react", "18.3.1")).to.be.revertedWith(
      "Package version not registered"
    );

    await expect(
      registry.verifyPackage("react", "18.3.1", sample.hash)
    ).to.be.revertedWith("Package version not registered");
  });

  it("allows the same package name with a different version", async function () {
    const { registry } = await deployRegistry();

    await registry.registerPackage(
      sample.name,
      "4.21.0",
      sample.hash,
      sample.source
    );
    await registry.registerPackage(
      sample.name,
      "5.0.0",
      "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      sample.source
    );

    const v4 = await registry.getPackage(sample.name, "4.21.0");
    const v5 = await registry.getPackage(sample.name, "5.0.0");

    expect(v4.packageHash).to.equal(sample.hash);
    expect(v5.version).to.equal("5.0.0");
  });

  it("getPackageHistory returns versions in registration order", async function () {
    const { registry } = await deployRegistry();

    expect(await registry.getPackageHistory(sample.name)).to.deep.equal([]);

    await registry.registerPackage(
      sample.name,
      "4.21.0",
      sample.hash,
      sample.source
    );
    await registry.registerPackage(
      sample.name,
      "5.0.0",
      "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      sample.source
    );

    expect(await registry.getPackageHistory(sample.name)).to.deep.equal([
      "4.21.0",
      "5.0.0",
    ]);
  });

  it("getPackageHistory reverts on an empty package name", async function () {
    const { registry } = await deployRegistry();

    await expect(registry.getPackageHistory("")).to.be.revertedWith(
      "Package name required"
    );
  });

  it("authorizes the deployer as owner and publisher", async function () {
    const { registry, owner } = await deployRegistry();

    expect(await registry.owner()).to.equal(owner.address);
    expect(await registry.authorizedPublishers(owner.address)).to.equal(true);
  });

  it("reverts when an unauthorized wallet registers a package", async function () {
    const { registry, other } = await deployRegistry();

    await expect(
      registry
        .connect(other)
        .registerPackage(
          sample.name,
          sample.version,
          sample.hash,
          sample.source
        )
    ).to.be.revertedWith("Not authorized");
  });

  it("lets the owner authorize another publisher who can then register", async function () {
    const { registry, owner, other } = await deployRegistry();

    await expect(registry.authorizePublisher(other.address))
      .to.emit(registry, "PublisherAuthorized")
      .withArgs(other.address);

    await registry
      .connect(other)
      .registerPackage(sample.name, sample.version, sample.hash, sample.source);

    const record = await registry.getPackage(sample.name, sample.version);
    expect(record.publisher).to.equal(other.address);
    expect(record.publisher).to.not.equal(owner.address);
  });

  it("lets the owner revoke a publisher", async function () {
    const { registry, other } = await deployRegistry();

    await registry.authorizePublisher(other.address);
    await registry.revokePublisher(other.address);

    expect(await registry.authorizedPublishers(other.address)).to.equal(false);

    await expect(
      registry
        .connect(other)
        .registerPackage(
          sample.name,
          sample.version,
          sample.hash,
          sample.source
        )
    ).to.be.revertedWith("Not authorized");
  });

  it("does not let a non-owner authorize or revoke publishers", async function () {
    const { registry, owner, other } = await deployRegistry();

    await expect(
      registry.connect(other).authorizePublisher(other.address)
    ).to.be.revertedWith("Not owner");

    await expect(
      registry.connect(other).revokePublisher(owner.address)
    ).to.be.revertedWith("Not owner");
  });

  it("does not let the owner revoke themselves", async function () {
    const { registry, owner } = await deployRegistry();

    await expect(registry.revokePublisher(owner.address)).to.be.revertedWith(
      "Cannot revoke owner"
    );
  });
});
