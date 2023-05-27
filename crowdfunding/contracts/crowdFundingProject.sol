// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../../node_modules/@openzeppelin/contracts/access/Ownable.sol";


contract CrowdfundingProject is Ownable {
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

    event ProjectCreated(uint256 projectId, string name, uint256 goal, uint256 deadline, IERC20 ERC20Token);
    event ProjectFunded(uint256 projectId, uint256 totalContributions);
    event ContributionAdded(uint256 projectId, address contributor, uint256 amount);
    event RewardClaimed(uint256 projectId, address recipient, string reward);
    event FundsClaimed(uint256 projectId, address recipient, uint256 amount);
    event ProjectCancelled(uint256 projectId);
    event AdminFeeWithdrawn(uint256 amount);
    event ValidERC20TokenSet(IERC20 ERC20Token, bool isValid);

    constructor() {
        fee = 5; // default
    }

    modifier validateProjectExistance(uint256 _projectId) {
        require(_projectId > 0 && _projectId <= projectCount, "Invalid project ID");
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

    function contribute(uint256 _projectId) public payable validateProjectExistance(_projectId) {
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
        p.contributions[msg.sender] += amount;
        p.totalContributions += amount;
        emit ContributionAdded(_projectId, msg.sender, amount);
        if (p.totalContributions >= p.goal) {
            emit ProjectFunded(_projectId, p.totalContributions);
        }
    }

    function withdrawFunds(uint256 _projectId) public validateProjectExistance(_projectId) onlyProjectOwner(_projectId) {
        Project storage p = projects[_projectId];
        require(!p.fundsWithdrawn, "The project funds have already been withdrawn");
        require(block.timestamp >= p.deadline, "Cannot withdraw before deadline");
        require(p.totalContributions >= p.goal, "Cannot withdraw before reaching goal");

        uint256 amount = p.totalContributions;
        if (p.currencyType == CurrencyType.ETHER) {
            p.owner.transfer(amount);
        } else {
            p.ERCToken.transfer(p.owner, amount);
        }

        p.fundsWithdrawn = true;
        emit FundsClaimed(_projectId, msg.sender, amount);
    }

    function injectRewards(uint256 _projectId) public payable validateProjectExistance(_projectId) onlyProjectOwner(_projectId) {
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

    function claimRewards(uint256 _projectId) public validateProjectExistance(_projectId) {
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
    }

}
