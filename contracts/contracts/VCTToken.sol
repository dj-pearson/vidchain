// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title VCTToken
 * @dev VidChain Trading Coin (VCT) - The investment and governance token
 * @notice Used for staking, liquidity, trading, and DAO governance
 *
 * Features:
 * - Fixed supply of 1 billion tokens
 * - ERC-20 with permit for gasless approvals
 * - Role-based presale and vesting management
 * - Staking integration ready
 */
contract VCTToken is ERC20, ERC20Burnable, ERC20Permit, AccessControl, ReentrancyGuard {
    // ============ Roles ============

    /// @dev Role for managing presale operations
    bytes32 public constant PRESALE_MANAGER_ROLE = keccak256("PRESALE_MANAGER_ROLE");

    // ============ Constants ============

    /// @dev Total supply: 1 billion VCT tokens
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18;

    /// @dev Allocation percentages (in basis points, 10000 = 100%)
    uint256 public constant PRESALE_ALLOCATION = 4000;      // 40% - 400M tokens
    uint256 public constant ECOSYSTEM_ALLOCATION = 3000;    // 30% - 300M tokens
    uint256 public constant TEAM_ALLOCATION = 1500;         // 15% - 150M tokens
    uint256 public constant LIQUIDITY_ALLOCATION = 1000;    // 10% - 100M tokens
    uint256 public constant MARKETING_ALLOCATION = 500;     // 5% - 50M tokens

    // ============ Presale State ============

    /// @dev Presale round configuration
    struct PresaleRound {
        uint256 price;          // Price in wei per VCT
        uint256 allocation;     // Total tokens available
        uint256 sold;           // Tokens sold
        uint256 startTime;
        uint256 endTime;
        bool active;
    }

    /// @dev Current presale round (1, 2, or 3)
    uint8 public currentRound;

    /// @dev Presale rounds configuration
    mapping(uint8 => PresaleRound) public presaleRounds;

    /// @dev User purchases per round
    mapping(address => mapping(uint8 => uint256)) public userPurchases;

    // ============ Vesting State ============

    /// @dev Vesting schedule for team tokens
    struct VestingSchedule {
        uint256 totalAmount;
        uint256 released;
        uint256 startTime;
        uint256 cliffDuration;
        uint256 vestingDuration;
    }

    /// @dev Team vesting schedules
    mapping(address => VestingSchedule) public vestingSchedules;

    // ============ Allocation Wallets ============

    address public presaleWallet;
    address public ecosystemWallet;
    address public teamWallet;
    address public liquidityWallet;
    address public marketingWallet;

    // ============ Events ============

    event PresaleRoundStarted(uint8 indexed round, uint256 price, uint256 allocation);
    event PresaleRoundEnded(uint8 indexed round, uint256 sold);
    event TokensPurchased(address indexed buyer, uint8 indexed round, uint256 amount, uint256 paid);
    event VestingScheduleCreated(address indexed beneficiary, uint256 amount);
    event TokensVested(address indexed beneficiary, uint256 amount);

    // ============ Errors ============

    error PresaleNotActive();
    error RoundNotActive();
    error ExceedsAllocation();
    error InvalidPayment();
    error ZeroAddress();
    error VestingNotStarted();
    error NoTokensToVest();

    // ============ Constructor ============

    /**
     * @dev Initializes VCT with allocation wallets
     */
    constructor(
        address _presaleWallet,
        address _ecosystemWallet,
        address _teamWallet,
        address _liquidityWallet,
        address _marketingWallet
    )
        ERC20("VidChain Trading Coin", "VCT")
        ERC20Permit("VidChain Trading Coin")
    {
        if (_presaleWallet == address(0)) revert ZeroAddress();
        if (_ecosystemWallet == address(0)) revert ZeroAddress();
        if (_teamWallet == address(0)) revert ZeroAddress();
        if (_liquidityWallet == address(0)) revert ZeroAddress();
        if (_marketingWallet == address(0)) revert ZeroAddress();

        presaleWallet = _presaleWallet;
        ecosystemWallet = _ecosystemWallet;
        teamWallet = _teamWallet;
        liquidityWallet = _liquidityWallet;
        marketingWallet = _marketingWallet;

        // Grant roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PRESALE_MANAGER_ROLE, msg.sender);

        // Mint tokens to allocation wallets
        _mint(presaleWallet, (TOTAL_SUPPLY * PRESALE_ALLOCATION) / 10000);
        _mint(ecosystemWallet, (TOTAL_SUPPLY * ECOSYSTEM_ALLOCATION) / 10000);
        _mint(teamWallet, (TOTAL_SUPPLY * TEAM_ALLOCATION) / 10000);
        _mint(liquidityWallet, (TOTAL_SUPPLY * LIQUIDITY_ALLOCATION) / 10000);
        _mint(marketingWallet, (TOTAL_SUPPLY * MARKETING_ALLOCATION) / 10000);

        // Configure presale rounds
        // Round 1: $0.005 (0.005 * 10^18 = 5 * 10^15 wei per token)
        // Round 2: $0.0075
        // Round 3: $0.01
        presaleRounds[1] = PresaleRound({
            price: 5 * 10**15,          // $0.005 in wei (assuming 1 ETH = $1000)
            allocation: 150_000_000 * 10**18,
            sold: 0,
            startTime: 0,
            endTime: 0,
            active: false
        });

        presaleRounds[2] = PresaleRound({
            price: 75 * 10**14,         // $0.0075 in wei
            allocation: 150_000_000 * 10**18,
            sold: 0,
            startTime: 0,
            endTime: 0,
            active: false
        });

        presaleRounds[3] = PresaleRound({
            price: 10 * 10**15,         // $0.01 in wei
            allocation: 100_000_000 * 10**18,
            sold: 0,
            startTime: 0,
            endTime: 0,
            active: false
        });
    }

    // ============ Presale Functions ============

    /**
     * @dev Starts a presale round
     * @param _round Round number (1, 2, or 3)
     * @param _duration Duration in seconds
     */
    function startPresaleRound(uint8 _round, uint256 _duration)
        external
        onlyRole(PRESALE_MANAGER_ROLE)
    {
        require(_round >= 1 && _round <= 3, "Invalid round");
        require(!presaleRounds[_round].active, "Round already active");

        // End previous round if active
        if (currentRound > 0 && presaleRounds[currentRound].active) {
            presaleRounds[currentRound].active = false;
            presaleRounds[currentRound].endTime = block.timestamp;
            emit PresaleRoundEnded(currentRound, presaleRounds[currentRound].sold);
        }

        currentRound = _round;
        presaleRounds[_round].active = true;
        presaleRounds[_round].startTime = block.timestamp;
        presaleRounds[_round].endTime = block.timestamp + _duration;

        emit PresaleRoundStarted(_round, presaleRounds[_round].price, presaleRounds[_round].allocation);
    }

    /**
     * @dev Purchase tokens in current presale round
     */
    function purchasePresale() external payable nonReentrant {
        if (currentRound == 0) revert PresaleNotActive();

        PresaleRound storage round = presaleRounds[currentRound];
        if (!round.active) revert RoundNotActive();
        if (block.timestamp > round.endTime) revert RoundNotActive();

        // Calculate tokens to receive
        uint256 tokenAmount = (msg.value * 10**18) / round.price;

        if (tokenAmount == 0) revert InvalidPayment();
        if (round.sold + tokenAmount > round.allocation) revert ExceedsAllocation();

        // Update state
        round.sold += tokenAmount;
        userPurchases[msg.sender][currentRound] += tokenAmount;

        // Transfer tokens from presale wallet
        _transfer(presaleWallet, msg.sender, tokenAmount);

        emit TokensPurchased(msg.sender, currentRound, tokenAmount, msg.value);
    }

    /**
     * @dev End current presale round
     */
    function endPresaleRound() external onlyRole(PRESALE_MANAGER_ROLE) {
        if (currentRound == 0) revert PresaleNotActive();
        if (!presaleRounds[currentRound].active) revert RoundNotActive();

        presaleRounds[currentRound].active = false;
        presaleRounds[currentRound].endTime = block.timestamp;

        emit PresaleRoundEnded(currentRound, presaleRounds[currentRound].sold);
    }

    // ============ Vesting Functions ============

    /**
     * @dev Create a vesting schedule for team member
     * @param _beneficiary Address to receive vested tokens
     * @param _amount Total tokens to vest
     * @param _cliffDuration Cliff period in seconds
     * @param _vestingDuration Total vesting period in seconds
     */
    function createVestingSchedule(
        address _beneficiary,
        uint256 _amount,
        uint256 _cliffDuration,
        uint256 _vestingDuration
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_beneficiary == address(0)) revert ZeroAddress();
        require(vestingSchedules[_beneficiary].totalAmount == 0, "Schedule exists");

        vestingSchedules[_beneficiary] = VestingSchedule({
            totalAmount: _amount,
            released: 0,
            startTime: block.timestamp,
            cliffDuration: _cliffDuration,
            vestingDuration: _vestingDuration
        });

        emit VestingScheduleCreated(_beneficiary, _amount);
    }

    /**
     * @dev Release vested tokens to beneficiary
     * @param _beneficiary Address to release tokens to
     */
    function releaseVestedTokens(address _beneficiary) external nonReentrant {
        VestingSchedule storage schedule = vestingSchedules[_beneficiary];

        if (schedule.totalAmount == 0) revert VestingNotStarted();
        if (block.timestamp < schedule.startTime + schedule.cliffDuration) {
            revert VestingNotStarted();
        }

        uint256 vestedAmount = calculateVestedAmount(_beneficiary);
        uint256 releasable = vestedAmount - schedule.released;

        if (releasable == 0) revert NoTokensToVest();

        schedule.released += releasable;
        _transfer(teamWallet, _beneficiary, releasable);

        emit TokensVested(_beneficiary, releasable);
    }

    /**
     * @dev Calculate vested amount for beneficiary
     */
    function calculateVestedAmount(address _beneficiary) public view returns (uint256) {
        VestingSchedule storage schedule = vestingSchedules[_beneficiary];

        if (schedule.totalAmount == 0) return 0;
        if (block.timestamp < schedule.startTime + schedule.cliffDuration) return 0;

        uint256 elapsed = block.timestamp - schedule.startTime;

        if (elapsed >= schedule.vestingDuration) {
            return schedule.totalAmount;
        }

        return (schedule.totalAmount * elapsed) / schedule.vestingDuration;
    }

    // ============ View Functions ============

    /**
     * @dev Get presale round info
     */
    function getPresaleRound(uint8 _round) external view returns (
        uint256 price,
        uint256 allocation,
        uint256 sold,
        uint256 remaining,
        bool active
    ) {
        PresaleRound storage round = presaleRounds[_round];
        return (
            round.price,
            round.allocation,
            round.sold,
            round.allocation - round.sold,
            round.active && block.timestamp <= round.endTime
        );
    }

    /**
     * @dev Withdraw presale funds to treasury
     */
    function withdrawPresaleFunds(address _to) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_to == address(0)) revert ZeroAddress();
        payable(_to).transfer(address(this).balance);
    }

    // ============ Receive ETH ============

    receive() external payable {
        // Accept ETH for presale
    }
}
