// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./node_modules/@openzeppelin/contracts/access/Ownable.sol";


contract CrowdfundingProject is Ownable {
    // enum CurrencyType { ETHER, ERC20 }
    struct Project {
        string name;
        string description;
        uint256 goal;
        uint256 deadline;
        uint256 minimumContribution;
        address payable owner;
        mapping(address => uint256) contributions;
        uint256 totalContributions;
        mapping(address => bool) claimed;
        IERC20 ERCToken;
        mapping(address => uint256) rewards;
        bool funded;
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

    function setPlatformFee( uint256  _newFee) public onlyOwner {
        require(_newFee > 0  && _newFee < 100, "Fee should be a percentage, between 0 and 100");
        fee = _newFee;
    }

    function setValidCurrency(IERC20 _ERC20Token, bool _isValid) public onlyOwner {
        validERC20Tokens[_ERC20Token] = _isValid;
        emit ValidERC20TokenSet(_ERC20Token, _isValid);
    }

    function createProject(string memory _name, string memory _description, uint256 _goal, uint256 _deadline, uint256 _minimumContribution, IERC20 _ERCToken) public {
        // payable function, is it needed?
        // require(msg.value == BASE_PRICE, "The specified amount of Ether is required to execute this function.");
        require(_goal > 0, "Goal should be greater than zero");
        require(_deadline > block.timestamp, "Deadline should be in the future");
        require(bytes(_name).length > 0, "Name should not be empty");
        require(validERC20Tokens[_ERCToken], "This ERC20 token is not supported by the platform");
        // projectCount++;
        // projects[projectCount] = Project({
        //     name: _name,
        //     description: _description,
        //     goal: _goal,
        //     deadline: _deadline,
        //     minimumContribution: _minimumContribution,
        //     owner: payable(msg.sender),
        //     totalContributions: 0,
        //     currency: _currency,
        //     funded: false
        // });
        Project storage p = projects[projectCount++];
        p.name = _name;
        p.description=  _description;
        p.goal = _goal;
        p.deadline = _deadline;
        p.minimumContribution = _minimumContribution;
        p.owner = payable(msg.sender);
        p.totalContributions = 0;
        p.ERCToken = _ERCToken;
        p.funded = false;
        emit ProjectCreated(projectCount, _name, _goal, _deadline, _ERCToken);
    }

    function contribute(uint256 _projectId) public payable {
        require(_projectId > 0 && _projectId <= projectCount, "Invalid project ID");
        require(msg.value >= projects[_projectId].minimumContribution, "Minimum contribution not met");
        require(block.timestamp < projects[_projectId].deadline, "Deadline passed");
        // Missing check if ETH or ERC20
        // SI es payable, que onda, cuanto es de payable?
        projects[_projectId].contributions[msg.sender] += msg.value;
        projects[_projectId].totalContributions += msg.value;
        emit ContributionAdded(_projectId, msg.sender, msg.value);
        if (projects[_projectId].totalContributions >= projects[_projectId].goal && !projects[_projectId].funded) {
            projects[_projectId].funded = true;
            emit ProjectFunded(_projectId, projects[_projectId].totalContributions);
        }
    }

    modifier onlyProjectOwner(uint256 _projectId) {
        require(msg.sender == projects[_projectId].owner, "Only project owner can perform this action");
        _;
    }

    function claimRewards(uint256 _projectId, uint256 _rewardIndex) public {
        require(_projectId > 0 && _projectId <= projectCount, "Invalid project ID");
        require(projects[_projectId].contributions[msg.sender] > 0, "No contribution found");
        // require(projects[_projectId].funded, "Project is not yet fully funded");
        // require(block.timestamp > projects[_projectId].deadline, "Deadline has not yet passed");
        require(!projects[_projectId].claimed[msg.sender], "Rewards already claimed");
        // Que es lo que se va a dar de recompensa? Mas ether?
        projects[_projectId].claimed[msg.sender] = true;
        // emit RewardClaimed(_projectId, msg.sender, projects[_projectId].rewards[_rewardIndex] .... mmmm...);
    }

    function claimFunds(uint256 _projectId) public {
        require(_projectId > 0 && _projectId <= projectCount, "Invalid project ID");
        require(block.timestamp > projects[_projectId].deadline, "Deadline has not yet passed");
        require(projects[_projectId].contributions[msg.sender] <= 0, "There have been no contributions made from this address or they may have already been claimed");
        require(projects[_projectId].totalContributions >= projects[_projectId].goal, "The goal has been achieved, and no refunds will be issued");
        uint256 amountToTransfer = projects[_projectId].contributions[msg.sender];
        address payable _sender = payable(msg.sender);
        _sender.transfer(amountToTransfer); 
        emit FundsClaimed(_projectId, msg.sender, amountToTransfer);
        projects[_projectId].contributions[msg.sender] = 0;
    }

    function withdrawFunds(uint256 _projectId) public onlyProjectOwner(_projectId) {
        require(_projectId > 0 && _projectId <= projectCount, "Invalid project ID");
        require(projects[_projectId].funded, "Project is not yet fully funded");
        require(!projects[_projectId].claimed[msg.sender], "Funds already claimed");
        projects[_projectId].claimed[msg.sender] = true;
        projects[_projectId].owner.transfer(projects[_projectId].totalContributions);
    }

    function injectRewards(uint256 _projectId, uint256 _rewardIndex) public payable onlyProjectOwner(_projectId) {
        require(_projectId > 0 && _projectId <= projectCount, "Invalid project ID");
        require(!projects[_projectId].claimed[msg.sender], "Reward already claimed");
        require(block.timestamp < projects[_projectId].deadline, "Deadline has already passed");
        // que onda?
        // require(_rewardIndex >= 0 && _rewardIndex < getRewardsCount(_projectId), "Invalid reward index");
        // string memory reward = getReward(_projectId, _rewardIndex);
        // require(bytes(reward).length > 0, "Reward should not be empty");
        // projects[_projectId].claimed[msg.sender] = true;
        // projects[_projectId].rewards[msg.sender] = _rewardIndex;
        // emit RewardClaimed(_projectId, msg.sender, reward.... mmm .....);
    }

    function getProjects() public view returns (uint[] memory) {
        uint[] memory projectIds = new uint[](projectCount);
        for (uint i = 0; i < projectCount; i++) {
            projectIds[i] = i;
        }
        return projectIds;
    }

    // function addReward(uint256 _projectId, uint256 _index, string memory _reward) public {
    //     Project storage project = projects[_projectId];
    //     project.rewards[_index] = _reward;
    // }
}
