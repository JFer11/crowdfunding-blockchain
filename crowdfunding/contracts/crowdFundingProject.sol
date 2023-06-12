// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";
import "../node_modules/@openzeppelin/contracts/security/ReentrancyGuard.sol";


contract CrowdfundingProject is Ownable, ReentrancyGuard {
    enum CurrencyType { ETHER, ERC20 }
    struct Project {
        string name;
        string description;
        uint256 goal;
        uint256 deadline;
        uint256 minimumContribution;
        address payable owner;
        mapping(address => uint256) contributions;
        uint256 totalContributions;
        CurrencyType currencyType;
        IERC20 ERCToken;
        bool fundsWithdrawn;
        uint256 fundsInjected;
        mapping(address => bool) rewardsClaimed;
    }
    mapping(uint256 => Project) public projects;
    uint256 public projectCount;
    uint256 public fee;
    mapping(IERC20 => bool) public validERC20Tokens;
    mapping(IERC20 => uint256) public platformERC20Fees;
    uint256 public platformEtherFees;

    event ProjectCreated(uint256 projectId, string name, uint256 goal, uint256 deadline, IERC20 ERC20Token);
    event ProjectFunded(uint256 projectId, uint256 totalContributions);
    event ContributionAdded(uint256 projectId, address contributor, uint256 amount);
    event RewardClaimed(uint256 projectId, address recipient, uint256 reward);
    event FundsClaimed(uint256 projectId, address recipient, uint256 amount);
    event AdminFeeWithdrawn(uint256 amount, string currencyType);
    event ValidERC20TokenSet(IERC20 ERC20Token, bool isValid);
    event ContributionClaimed(uint256 projectId, address claimant, uint256 amount);

    constructor() {
        fee = 5; // default
    }

    modifier validateProjectExistance(uint256 _projectId) {
        require(_projectId >= 0 && _projectId <= projectCount -1, "Invalid project ID");
        _;
    }

    modifier onlyProjectOwner(uint256 _projectId) {
        require(msg.sender == projects[_projectId].owner, "Only project owner can perform this action");
        _;
    }


    function setPlatformFee( uint256  _newFee) public onlyOwner {
        require(_newFee > 0  && _newFee < 100, "Fee should be a percentage, between 0 and 100");
        fee = _newFee;
    }

    function setValidCurrency(IERC20 _ERC20Token, bool _isValid) public onlyOwner {
        validERC20Tokens[_ERC20Token] = _isValid;
        emit ValidERC20TokenSet(_ERC20Token, _isValid);
    }

    function createProject(string memory _name, string memory _description, uint256 _goal, uint256 _deadline, uint256 _minimumContribution, CurrencyType _currencyType, IERC20 _ERCToken) public {
        require(_goal > 0, "Goal should be greater than zero");
        require(_deadline > block.timestamp, "Deadline should be in the future"); 
        require(bytes(_name).length > 0, "Name should not be empty");
        require(_currencyType == CurrencyType.ETHER || validERC20Tokens[_ERCToken], "Invalid currency. Only Ether or supported ERC20 tokens are accepted");
        Project storage p = projects[projectCount++];
        p.name = _name;
        p.description=  _description;
        p.goal = _goal;
        p.deadline = _deadline;
        p.minimumContribution = _minimumContribution;
        p.owner = payable(msg.sender);
        p.totalContributions = 0;
        p.currencyType = _currencyType;
        if (_currencyType == CurrencyType.ERC20) {
            p.ERCToken = _ERCToken;
        }
        emit ProjectCreated(projectCount, _name, _goal, _deadline, _ERCToken);
    }

    function contribute(uint256 _projectId) public payable validateProjectExistance(_projectId) nonReentrant {
        Project storage p = projects[_projectId];
        require(!p.fundsWithdrawn, "The project funds have already been withdrawn");
        require(block.timestamp < p.deadline, "Deadline passed");
        uint256 amount;
        if (p.currencyType == CurrencyType.ETHER) {
            require(msg.value >= p.minimumContribution, "Minimum contribution not met");
            amount = msg.value;
        } else {
            uint256 allowance = p.ERCToken.allowance(msg.sender, address(this));
            require(allowance >= p.minimumContribution, "Minimum contribution not met");
            amount = allowance;
            p.ERCToken.transferFrom(msg.sender, address(this), amount);
        }
        p.contributions[msg.sender] += amount; // TODO: check if this is ok
        p.totalContributions += amount;
        emit ContributionAdded(_projectId, msg.sender, amount);
        if (p.totalContributions >= p.goal) {
            emit ProjectFunded(_projectId, p.totalContributions);
        }
    }

    function withdrawFunds(uint256 _projectId) public validateProjectExistance(_projectId) onlyProjectOwner(_projectId) nonReentrant {
        Project storage p = projects[_projectId];
        require(!p.fundsWithdrawn, "The project funds have already been withdrawn");
        require(block.timestamp >= p.deadline, "Cannot withdraw before deadline");
        require(p.totalContributions >= p.goal, "Cannot withdraw before reaching goal");

        uint256 platformFee = (p.totalContributions * fee) / 100;
        uint256 amount = p.totalContributions - platformFee;

        if (p.currencyType == CurrencyType.ETHER) {
            platformEtherFees += platformFee;
            p.owner.transfer(amount);
        } else {
            platformERC20Fees[p.ERCToken] += platformFee;
            p.ERCToken.transfer(p.owner, amount);
        }

        p.fundsWithdrawn = true;
        emit FundsClaimed(_projectId, msg.sender, amount);
    }

    function injectRewards(uint256 _projectId) public payable validateProjectExistance(_projectId) onlyProjectOwner(_projectId) nonReentrant {
        Project storage p = projects[_projectId];
        require(block.timestamp >= p.deadline, "Cannot inject funds before deadline");
        require(p.totalContributions >= p.goal, "Cannot inject funds before reaching goal");
        
        uint256 amount;
        if (p.currencyType == CurrencyType.ETHER) {
            require(msg.value > 0, "No Ether sent for injecting funds");
            amount = msg.value;
        } else {
            uint256 allowance = p.ERCToken.allowance(msg.sender, address(this));
            require(allowance > 0, "No ERC20 token allowed for injecting funds");
            amount = allowance;
            p.ERCToken.transferFrom(msg.sender, address(this), amount);
        }

        p.fundsInjected += amount;
    }

    function claimRewards(uint256 _projectId) public validateProjectExistance(_projectId) nonReentrant {
        Project storage p = projects[_projectId];
        require(block.timestamp >= p.deadline, "Cannot claim rewards before deadline");
        require(p.totalContributions >= p.goal, "Cannot claim rewards before reaching goal");
        require(p.fundsInjected > 0, "There are no funds injected in the project");

        uint256 reward = (p.contributions[msg.sender] * p.fundsInjected) / p.totalContributions;  // Goal is always > 0. So totalContributions > 0.

        require(reward > 0, "No rewards to claim");
        require(!p.rewardsClaimed[msg.sender], "Rewards already claimed");

        p.rewardsClaimed[msg.sender] = true;
        
        if (p.currencyType == CurrencyType.ETHER) {
            payable(msg.sender).transfer(reward);
        } else {
            p.ERCToken.transfer(msg.sender, reward);
        }
        emit RewardClaimed(_projectId, msg.sender, reward);
    }

    function claimContribution(uint256 _projectId) public validateProjectExistance(_projectId) nonReentrant {
        Project storage p = projects[_projectId];
        require(block.timestamp >= p.deadline, "Cannot claim contribution before deadline");
        require(p.totalContributions < p.goal, "Cannot claim contribution if the project had reached the financial goal");
        require(p.contributions[msg.sender] > 0, "You have not made any contributions");

        uint256 amount = p.contributions[msg.sender];
        p.contributions[msg.sender] = 0;
        p.totalContributions -= amount;

        if (p.currencyType == CurrencyType.ETHER) {
            payable(msg.sender).transfer(amount);
        } else {
            p.ERCToken.transfer(msg.sender, amount);
        }

        emit ContributionClaimed(_projectId, msg.sender, amount);
    }

    function withdrawPlatformFee(CurrencyType _currencyType, IERC20 _ERCToken) external onlyOwner nonReentrant {
        require(_currencyType == CurrencyType.ETHER || validERC20Tokens[_ERCToken], "Invalid currency. Only Ether or supported ERC20 tokens are accepted");
        uint256 amount;
        if (_currencyType == CurrencyType.ETHER) {
            require(platformEtherFees > 0, "No Ether fees to withdraw");
            amount = platformEtherFees;
            platformEtherFees = 0;
            payable(owner()).transfer(amount);
        } else {
            require(platformERC20Fees[_ERCToken] > 0, "No ERC20 fees to withdraw");
            amount = platformERC20Fees[_ERCToken];
            platformERC20Fees[_ERCToken] = 0;
            _ERCToken.transfer(owner(), amount);
        }
        emit AdminFeeWithdrawn(amount, _currencyType == CurrencyType.ETHER ? "ETHER" : "ERC20");
    }

}
