const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("Deploying VidChainNFT contract...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Get balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "MATIC\n");

  // Deploy VidChainNFT
  const VidChainNFT = await hre.ethers.getContractFactory("VidChainNFT");
  const vidChainNFT = await VidChainNFT.deploy();

  await vidChainNFT.waitForDeployment();

  const contractAddress = await vidChainNFT.getAddress();
  console.log("VidChainNFT deployed to:", contractAddress);

  // Get deployment transaction
  const deployTx = vidChainNFT.deploymentTransaction();
  console.log("Transaction hash:", deployTx.hash);

  // Wait for confirmations
  console.log("\nWaiting for block confirmations...");
  await deployTx.wait(5);
  console.log("Confirmed with 5 blocks\n");

  // Verify contract on Polygonscan (if not localhost)
  const network = hre.network.name;
  if (network !== "hardhat" && network !== "localhost") {
    console.log("Verifying contract on Polygonscan...");
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      console.log("Contract verified successfully!");
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log("Contract already verified");
      } else {
        console.error("Verification failed:", error.message);
      }
    }
  }

  // Log summary
  console.log("\n========================================");
  console.log("DEPLOYMENT SUMMARY");
  console.log("========================================");
  console.log("Network:", network);
  console.log("Contract Address:", contractAddress);
  console.log("Deployer:", deployer.address);
  console.log("Transaction:", deployTx.hash);
  console.log("========================================\n");

  // Write deployment info to file
  const deploymentInfo = {
    network,
    contractAddress,
    deployer: deployer.address,
    transactionHash: deployTx.hash,
    deployedAt: new Date().toISOString(),
  };

  const deploymentsDir = "./deployments";
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  fs.writeFileSync(
    `${deploymentsDir}/${network}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log(`Deployment info saved to ${deploymentsDir}/${network}.json`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
