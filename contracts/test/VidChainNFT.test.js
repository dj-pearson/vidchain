const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("VidChainNFT", function () {
  // Test fixture for deployment
  async function deployVidChainNFTFixture() {
    const [owner, user1, user2] = await ethers.getSigners();

    const VidChainNFT = await ethers.getContractFactory("VidChainNFT");
    const vidChainNFT = await VidChainNFT.deploy();

    // Sample video data
    const sampleHash = ethers.keccak256(ethers.toUtf8Bytes("sample_video_content"));
    const sampleCid = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";

    return { vidChainNFT, owner, user1, user2, sampleHash, sampleCid };
  }

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      const { vidChainNFT } = await loadFixture(deployVidChainNFTFixture);

      expect(await vidChainNFT.name()).to.equal("VidChain Verified");
      expect(await vidChainNFT.symbol()).to.equal("VIDC");
    });

    it("Should set the deployer as owner", async function () {
      const { vidChainNFT, owner } = await loadFixture(deployVidChainNFTFixture);

      expect(await vidChainNFT.owner()).to.equal(owner.address);
    });

    it("Should set default royalty to 5%", async function () {
      const { vidChainNFT } = await loadFixture(deployVidChainNFTFixture);

      expect(await vidChainNFT.royaltyBps()).to.equal(500);
    });

    it("Should have zero total supply initially", async function () {
      const { vidChainNFT } = await loadFixture(deployVidChainNFTFixture);

      expect(await vidChainNFT.totalSupply()).to.equal(0);
    });
  });

  describe("Minting", function () {
    it("Should mint a new NFT with correct data", async function () {
      const { vidChainNFT, user1, sampleHash, sampleCid } = await loadFixture(
        deployVidChainNFTFixture
      );

      const tx = await vidChainNFT.mintAuthenticated(sampleHash, sampleCid, user1.address);
      await tx.wait();

      // Check token ownership
      expect(await vidChainNFT.ownerOf(1)).to.equal(user1.address);

      // Check total supply
      expect(await vidChainNFT.totalSupply()).to.equal(1);

      // Check video record
      const record = await vidChainNFT.videoRecords(1);
      expect(record.sha256Hash).to.equal(sampleHash);
      expect(record.version).to.equal(1);
    });

    it("Should emit VideoAuthenticated event", async function () {
      const { vidChainNFT, user1, sampleHash, sampleCid } = await loadFixture(
        deployVidChainNFTFixture
      );

      await expect(vidChainNFT.mintAuthenticated(sampleHash, sampleCid, user1.address))
        .to.emit(vidChainNFT, "VideoAuthenticated");
    });

    it("Should prevent duplicate hash minting", async function () {
      const { vidChainNFT, user1, sampleHash, sampleCid } = await loadFixture(
        deployVidChainNFTFixture
      );

      // First mint should succeed
      await vidChainNFT.mintAuthenticated(sampleHash, sampleCid, user1.address);

      // Second mint with same hash should fail
      await expect(
        vidChainNFT.mintAuthenticated(sampleHash, sampleCid, user1.address)
      ).to.be.revertedWithCustomError(vidChainNFT, "AlreadyMinted");
    });

    it("Should reject invalid hash", async function () {
      const { vidChainNFT, user1, sampleCid } = await loadFixture(
        deployVidChainNFTFixture
      );

      await expect(
        vidChainNFT.mintAuthenticated(ethers.ZeroHash, sampleCid, user1.address)
      ).to.be.revertedWithCustomError(vidChainNFT, "InvalidHash");
    });

    it("Should reject empty CID", async function () {
      const { vidChainNFT, user1, sampleHash } = await loadFixture(
        deployVidChainNFTFixture
      );

      await expect(
        vidChainNFT.mintAuthenticated(sampleHash, "", user1.address)
      ).to.be.revertedWithCustomError(vidChainNFT, "InvalidCID");
    });

    it("Should reject zero address recipient", async function () {
      const { vidChainNFT, sampleHash, sampleCid } = await loadFixture(
        deployVidChainNFTFixture
      );

      await expect(
        vidChainNFT.mintAuthenticated(sampleHash, sampleCid, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(vidChainNFT, "ZeroAddress");
    });
  });

  describe("Batch Minting", function () {
    it("Should batch mint multiple NFTs", async function () {
      const { vidChainNFT, user1 } = await loadFixture(deployVidChainNFTFixture);

      const hashes = [
        ethers.keccak256(ethers.toUtf8Bytes("video1")),
        ethers.keccak256(ethers.toUtf8Bytes("video2")),
        ethers.keccak256(ethers.toUtf8Bytes("video3")),
      ];
      const cids = ["QmCid1", "QmCid2", "QmCid3"];

      const tx = await vidChainNFT.batchMintAuthenticated(hashes, cids, user1.address);
      await tx.wait();

      // Check all tokens were minted
      expect(await vidChainNFT.totalSupply()).to.equal(3);
      expect(await vidChainNFT.ownerOf(1)).to.equal(user1.address);
      expect(await vidChainNFT.ownerOf(2)).to.equal(user1.address);
      expect(await vidChainNFT.ownerOf(3)).to.equal(user1.address);
    });

    it("Should reject batch with mismatched arrays", async function () {
      const { vidChainNFT, user1 } = await loadFixture(deployVidChainNFTFixture);

      const hashes = [ethers.keccak256(ethers.toUtf8Bytes("video1"))];
      const cids = ["QmCid1", "QmCid2"];

      await expect(
        vidChainNFT.batchMintAuthenticated(hashes, cids, user1.address)
      ).to.be.revertedWith("Array length mismatch");
    });
  });

  describe("Verification", function () {
    it("Should verify by token ID", async function () {
      const { vidChainNFT, user1, sampleHash, sampleCid } = await loadFixture(
        deployVidChainNFTFixture
      );

      await vidChainNFT.mintAuthenticated(sampleHash, sampleCid, user1.address);

      const [hash, cidHash, timestamp, owner, exists] = await vidChainNFT.verify(1);

      expect(hash).to.equal(sampleHash);
      expect(cidHash).to.equal(ethers.keccak256(ethers.toUtf8Bytes(sampleCid)));
      expect(timestamp).to.be.gt(0);
      expect(owner).to.equal(user1.address);
      expect(exists).to.be.true;
    });

    it("Should return false for non-existent token", async function () {
      const { vidChainNFT } = await loadFixture(deployVidChainNFTFixture);

      const [, , , , exists] = await vidChainNFT.verify(999);
      expect(exists).to.be.false;
    });

    it("Should verify by hash", async function () {
      const { vidChainNFT, user1, sampleHash, sampleCid } = await loadFixture(
        deployVidChainNFTFixture
      );

      await vidChainNFT.mintAuthenticated(sampleHash, sampleCid, user1.address);

      const [tokenId, timestamp, owner, exists] = await vidChainNFT.verifyByHash(
        sampleHash
      );

      expect(tokenId).to.equal(1);
      expect(timestamp).to.be.gt(0);
      expect(owner).to.equal(user1.address);
      expect(exists).to.be.true;
    });

    it("Should check if hash is minted", async function () {
      const { vidChainNFT, user1, sampleHash, sampleCid } = await loadFixture(
        deployVidChainNFTFixture
      );

      // Before minting
      expect(await vidChainNFT.isHashMinted(sampleHash)).to.be.false;

      // After minting
      await vidChainNFT.mintAuthenticated(sampleHash, sampleCid, user1.address);
      expect(await vidChainNFT.isHashMinted(sampleHash)).to.be.true;
    });
  });

  describe("Royalties (EIP-2981)", function () {
    it("Should return correct royalty info", async function () {
      const { vidChainNFT, owner, user1, sampleHash, sampleCid } = await loadFixture(
        deployVidChainNFTFixture
      );

      await vidChainNFT.mintAuthenticated(sampleHash, sampleCid, user1.address);

      const salePrice = ethers.parseEther("1");
      const [receiver, royaltyAmount] = await vidChainNFT.royaltyInfo(1, salePrice);

      expect(receiver).to.equal(owner.address);
      expect(royaltyAmount).to.equal(ethers.parseEther("0.05")); // 5%
    });

    it("Should allow owner to update royalty", async function () {
      const { vidChainNFT, owner } = await loadFixture(deployVidChainNFTFixture);

      await expect(vidChainNFT.connect(owner).setRoyaltyBps(300))
        .to.emit(vidChainNFT, "RoyaltyUpdated")
        .withArgs(300);

      expect(await vidChainNFT.royaltyBps()).to.equal(300);
    });

    it("Should reject royalty above maximum", async function () {
      const { vidChainNFT } = await loadFixture(deployVidChainNFTFixture);

      await expect(vidChainNFT.setRoyaltyBps(1500)).to.be.revertedWithCustomError(
        vidChainNFT,
        "RoyaltyTooHigh"
      );
    });

    it("Should only allow owner to update royalty", async function () {
      const { vidChainNFT, user1 } = await loadFixture(deployVidChainNFTFixture);

      await expect(
        vidChainNFT.connect(user1).setRoyaltyBps(300)
      ).to.be.revertedWithCustomError(vidChainNFT, "OwnableUnauthorizedAccount");
    });
  });

  describe("Token URI", function () {
    it("Should set and return base URI", async function () {
      const { vidChainNFT, user1, sampleHash, sampleCid } = await loadFixture(
        deployVidChainNFTFixture
      );

      await vidChainNFT.mintAuthenticated(sampleHash, sampleCid, user1.address);
      await vidChainNFT.setBaseURI("https://api.vidchain.io/metadata/");

      expect(await vidChainNFT.tokenURI(1)).to.equal(
        "https://api.vidchain.io/metadata/1.json"
      );
    });

    it("Should return empty string without base URI", async function () {
      const { vidChainNFT, user1, sampleHash, sampleCid } = await loadFixture(
        deployVidChainNFTFixture
      );

      await vidChainNFT.mintAuthenticated(sampleHash, sampleCid, user1.address);

      expect(await vidChainNFT.tokenURI(1)).to.equal("");
    });

    it("Should revert for non-existent token", async function () {
      const { vidChainNFT } = await loadFixture(deployVidChainNFTFixture);

      await expect(vidChainNFT.tokenURI(1)).to.be.revertedWithCustomError(
        vidChainNFT,
        "NonexistentToken"
      );
    });
  });

  describe("Interface Support", function () {
    it("Should support ERC721 interface", async function () {
      const { vidChainNFT } = await loadFixture(deployVidChainNFTFixture);

      // ERC721 interface ID
      expect(await vidChainNFT.supportsInterface("0x80ac58cd")).to.be.true;
    });

    it("Should support ERC2981 interface", async function () {
      const { vidChainNFT } = await loadFixture(deployVidChainNFTFixture);

      // ERC2981 interface ID
      expect(await vidChainNFT.supportsInterface("0x2a55205a")).to.be.true;
    });

    it("Should support ERC165 interface", async function () {
      const { vidChainNFT } = await loadFixture(deployVidChainNFTFixture);

      // ERC165 interface ID
      expect(await vidChainNFT.supportsInterface("0x01ffc9a7")).to.be.true;
    });
  });

  describe("Gas Optimization", function () {
    it("Should use reasonable gas for minting", async function () {
      const { vidChainNFT, user1, sampleHash, sampleCid } = await loadFixture(
        deployVidChainNFTFixture
      );

      const tx = await vidChainNFT.mintAuthenticated(sampleHash, sampleCid, user1.address);
      const receipt = await tx.wait();

      // Gas should be under 200k for a single mint
      expect(receipt.gasUsed).to.be.lt(200000);
      console.log("Gas used for mint:", receipt.gasUsed.toString());
    });
  });
});
