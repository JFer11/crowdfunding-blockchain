const { expect } = require('chai');
const { ethers } = require('hardhat');


const ONE_DAY = 86400;
function days(n) {
  return ONE_DAY * n;
}
const DATE_I = days(3);    // 259200
const DATE_II = days(4);   // 345600
const DATE_III = days(5);  // 432000
const DATE_IV = days(6);   // 518400
const DATE_V = days(7);    // 604800
const DATE_VI = days(8);   // 691200
const DATE_VII = days(9);  // 777600
const DATE_VIII = days(10); // 864000
const DATE_IX = days(11);   // 950400
const DATE_X = days(12);    // 1036800
const DATE_XI = days(13);   // 1123200
const DATE_XII = days(14);  // 1209600
const DATE_XIII = days(15); // 1296000
const DATE_XIV = days(16);  // 1382400
const DATE_XV = days(17);   // 1468800
const DATE_XVI = days(18);  // 1555200
const DATE_XVII = days(19); // 1641600
const DATE_XVIII = days(20); // 1728000
const DATE_XIX = days(21);  // 1814400


async function initializeCrowdfundingProject() {
  CrowdfundingProject = await ethers.getContractFactory('CrowdfundingProject');
  [owner, addr1, addr2, _] = await ethers.getSigners();
  crowdfundingProject = await CrowdfundingProject.deploy();
  return [CrowdfundingProject, owner, addr1, addr2, crowdfundingProject]
}

async function cleanupCrowdfundingProject() {
  CrowdfundingProject = null;
  owner = null;
  addr1 = null;
  addr2 = null;
  crowdfundingProject = null;
}

describe('CrowdfundingProject', function () {
  describe('Deployment', function () {
    let CrowdfundingProject, crowdfundingProject, owner, addr1, addr2;

    before(async () => {
      [CrowdfundingProject, owner, addr1, addr2, crowdfundingProject] = await initializeCrowdfundingProject();
    });
  
    after(async () => {
      await cleanupCrowdfundingProject();
    });

    it('Should set the right owner', async function () {
      expect(await crowdfundingProject.owner()).to.equal(owner.address);
    });

    it('Should set the platform fee to default', async function () {
      expect(await crowdfundingProject.fee()).to.equal(5);
    });
  });

  describe('Setting Platform Fee', function () {
    let CrowdfundingProject, crowdfundingProject, owner, addr1, addr2;

    before(async () => {
      [CrowdfundingProject, owner, addr1, addr2, crowdfundingProject] = await initializeCrowdfundingProject();
    });
  
    after(async () => {
      await cleanupCrowdfundingProject();
    });

    it('Should set the platform fee successfully', async function () {
      await crowdfundingProject.connect(owner).setPlatformFee(10);
      expect(await crowdfundingProject.fee()).to.equal(10);
    });

    it('Should not allow non-owner to set the platform fee', async function () {
      await expect(crowdfundingProject.connect(addr1).setPlatformFee(10)).to.be.revertedWith("Ownable: caller is not the owner");
    });
  
    it('Should not allow setting a fee of less than or equal to 0', async function () {
      await expect(crowdfundingProject.connect(owner).setPlatformFee(0)).to.be.revertedWith("Fee should be a percentage, between 0 and 100");
    });
  
    it('Should not allow setting a fee of greater than or equal to 100', async function () {
      await expect(crowdfundingProject.connect(owner).setPlatformFee(100)).to.be.revertedWith("Fee should be a percentage, between 0 and 100");
    });
  });

  describe('Creating a project', function () {
    let CrowdfundingProject, crowdfundingProject, owner, addr1, addr2;

    beforeEach(async () => {
      [CrowdfundingProject, owner, addr1, addr2, crowdfundingProject] = await initializeCrowdfundingProject();
    });
  
    afterEach(async () => {
      await cleanupCrowdfundingProject();
    });

    it('Should create a project successfully', async function () {
      await crowdfundingProject.createProject(
        'Test Project',
        'Test Description',
        ethers.utils.parseEther('10'),
        Math.floor(Date.now() / 1000) + ONE_DAY,
        ethers.utils.parseEther('0.1'),
        0, // Ether as currency
        ethers.constants.AddressZero // Dummy ERC20 token address
      );
      const project = await crowdfundingProject.projects(0);
      expect(project.name).to.equal('Test Project');
    });

    it('Should fail when goal is zero', async function () {
      await expect(crowdfundingProject.createProject(
        'Test Project',
        'Test Description',
        0, // Zero goal
        Math.floor(Date.now() / 1000) + ONE_DAY,
        ethers.utils.parseEther('0.1'),
        0, // Ether as currency
        ethers.constants.AddressZero // Dummy ERC20 token address
      )).to.be.revertedWith("Goal should be greater than zero");
    });
  
    it('Should fail when deadline is in the past', async function () {
      await expect(crowdfundingProject.createProject(
        'Test Project',
        'Test Description',
        ethers.utils.parseEther('10'),
        Math.floor(Date.now() / 1000) - ONE_DAY, // Deadline in the past
        ethers.utils.parseEther('0.1'),
        0, // Ether as currency
        ethers.constants.AddressZero // Dummy ERC20 token address
      )).to.be.revertedWith("Deadline should be in the future");
    });
  
    it('Should fail when name is empty', async function () {
      await expect(crowdfundingProject.createProject(
        '', // Empty name
        'Test Description',
        ethers.utils.parseEther('10'),
        Math.floor(Date.now() / 1000) + ONE_DAY,
        ethers.utils.parseEther('0.1'),
        0, // Ether as currency
        ethers.constants.AddressZero // Dummy ERC20 token address
      )).to.be.revertedWith("Name should not be empty");
    });
  
    it('Should fail when currencyType is neither ETHER nor supported ERC20', async function () {
      // Set the ERC20 token as invalid
      await crowdfundingProject.setValidCurrency(ethers.constants.AddressZero, false);
    
      await expect(crowdfundingProject.createProject(
        'Test Project',
        'Test Description',
        ethers.utils.parseEther('10'),
        Math.floor(Date.now() / 1000) + ONE_DAY,
        ethers.utils.parseEther('0.1'),
        1, // ERC20 as currencyType
        ethers.constants.AddressZero // Invalid ERC20 token address
      )).to.be.revertedWith("Invalid currency. Only Ether or supported ERC20 tokens are accepted");
    });
    
    it('Should create a project successfully with ERC20 as currencyType', async function () {
      // Set the ERC20 token as valid
      await crowdfundingProject.setValidCurrency('0x0000000000000000000000000000000000000001', true);
    
      await crowdfundingProject.createProject(
        'Test Project',
        'Test Description',
        ethers.utils.parseEther('10'),
        Math.floor(Date.now() / 1000) + ONE_DAY,
        ethers.utils.parseEther('0.1'),
        1, // ERC20 as currencyType
        '0x0000000000000000000000000000000000000001' // Valid ERC20 token address
      );
    
      const project = await crowdfundingProject.projects(0);
      expect(project.name).to.equal('Test Project');
      expect(project.ERCToken).to.equal('0x0000000000000000000000000000000000000001');
    });    
  });

  describe('Setting Valid Currency', function () {
    let CrowdfundingProject, crowdfundingProject, owner, addr1, addr2;
    let validToken;
  
    beforeEach(async () => {
      [CrowdfundingProject, owner, addr1, addr2, crowdfundingProject] = await initializeCrowdfundingProject();
  
      const ERC20 = await ethers.getContractFactory('SimpleERC20');
      validToken = await ERC20.deploy(ethers.utils.parseEther('10000'));
      await validToken.deployed();
    });
  
    afterEach(async () => {
      await cleanupCrowdfundingProject();
    });
  
    it('Should set valid currency successfully', async function () {
      await expect(crowdfundingProject.connect(owner).setValidCurrency(validToken.address, true))
        .to.emit(crowdfundingProject, 'ValidERC20TokenSet')
        .withArgs(validToken.address, true);
  
      expect(await crowdfundingProject.validERC20Tokens(validToken.address)).to.equal(true);
    });
  
    it('Should not allow non-owner to set valid currency', async function () {
      await expect(crowdfundingProject.connect(addr1).setValidCurrency(validToken.address, true)).to.be.revertedWith("Ownable: caller is not the owner");
    });
  
    it('Should remove valid currency successfully', async function () {
      // Set as valid first
      await crowdfundingProject.connect(owner).setValidCurrency(validToken.address, true);
      expect(await crowdfundingProject.validERC20Tokens(validToken.address)).to.equal(true);
  
      // Then remove it
      await expect(crowdfundingProject.connect(owner).setValidCurrency(validToken.address, false))
        .to.emit(crowdfundingProject, 'ValidERC20TokenSet')
        .withArgs(validToken.address, false);
  
      expect(await crowdfundingProject.validERC20Tokens(validToken.address)).to.equal(false);
    });
  });  

  describe('Contributing to a project', function () {
    let CrowdfundingProject, crowdfundingProject, owner, addr1, addr2;

    before(async () => {
      [CrowdfundingProject, owner, addr1, addr2, crowdfundingProject] = await initializeCrowdfundingProject();
    });
  
    after(async () => {
      await cleanupCrowdfundingProject();
    });

    it('Should contribute to a project successfully', async function () {
      // A project needs to be created first.
      await crowdfundingProject.createProject(
        'Test Project',
        'Test Description',
        ethers.utils.parseEther('10'),
        Math.floor(Date.now() / 1000) + ONE_DAY,
        ethers.utils.parseEther('0.1'),
        0, // Ether as currency
        ethers.constants.AddressZero // Dummy ERC20 token address
      );

      // contribute with address 1
      await crowdfundingProject.connect(addr1).contribute(0, {
        value: ethers.utils.parseEther('12'),
      });
      const project = await crowdfundingProject.projects(0);
      expect(project.totalContributions).to.equal(
        ethers.utils.parseEther('12')
      );
    });
  });

  describe('Withdrawing Funds - Part 1', function () {
    let CrowdfundingProject, crowdfundingProject, owner, addr1, addr2;

    before(async () => {
      [CrowdfundingProject, owner, addr1, addr2, crowdfundingProject] = await initializeCrowdfundingProject();
    });
  
    after(async () => {
      await cleanupCrowdfundingProject();
    });

    it('Should withdraw funds successfully', async function () {
      // A project needs to be created first.
      await crowdfundingProject.createProject(
        'Test Project',
        'Test Description',
        ethers.utils.parseEther('10'),
        Math.floor(Date.now() / 1000) + ONE_DAY,
        ethers.utils.parseEther('0.1'),
        0, // Ether as currency
        ethers.constants.AddressZero // Dummy ERC20 token address
      );
      
      await crowdfundingProject.connect(addr1).contribute(0, {
        value: ethers.utils.parseEther('12'),
      });

      // 2 days have passed the project was created so the deadline has passed.
      await ethers.provider.send('evm_increaseTime', [ONE_DAY + ONE_DAY]);
      await ethers.provider.send('evm_mine'); // Mine the next block so the time change takes effect

      // Assumes sufficient contributions to the project.
      await crowdfundingProject.connect(owner).withdrawFunds(0);

      const project = await crowdfundingProject.projects(0);

      expect(project.fundsWithdrawn).to.equal(true);
    });
  });

  describe('Injecting Rewards - Part 1', function () {
    let CrowdfundingProject, crowdfundingProject, owner, addr1, addr2;

    before(async () => {
      [CrowdfundingProject, owner, addr1, addr2, crowdfundingProject] = await initializeCrowdfundingProject();
    });
      
    after(async () => {
      await cleanupCrowdfundingProject();
    });

    it('Should inject rewards successfully', async function () {
      // A project needs to be created first.
      await crowdfundingProject.createProject(
        'Test Project',
        'Test Description',
        ethers.utils.parseEther('10'),
        Math.floor(Date.now() / 1000) + DATE_I,
        ethers.utils.parseEther('0.1'),
        0, // Ether as currency
        ethers.constants.AddressZero // Dummy ERC20 token address
      );

      await crowdfundingProject.connect(addr1).contribute(0, {
        value: ethers.utils.parseEther('15'),
      });

      await ethers.provider.send('evm_increaseTime', [ONE_DAY]);
      await ethers.provider.send('evm_mine'); // Mine the next block so the time change takes effect
      
      await crowdfundingProject
        .connect(owner)
        .injectRewards(0, { value: ethers.utils.parseEther('1') });

      const project = await crowdfundingProject.projects(0);
      
      expect(project.fundsInjected).to.equal(ethers.utils.parseEther('1'));
    });
  });

  describe('Claiming Rewards - Part 1', function () {
    let CrowdfundingProject, crowdfundingProject, owner, addr1, addr2;

    before(async () => {
      [CrowdfundingProject, owner, addr1, addr2, crowdfundingProject] = await initializeCrowdfundingProject();
    });
      
    after(async () => {
      await cleanupCrowdfundingProject();
    });

    it('Should claim rewards successfully', async function () {
      // A project needs to be created first.
      await crowdfundingProject.createProject(
        'Test Project',
        'Test Description',
        ethers.utils.parseEther('10'),
        Math.floor(Date.now() / 1000) + DATE_II,
        ethers.utils.parseEther('0.1'),
        0, // Ether as currency
        ethers.constants.AddressZero // Dummy ERC20 token address
      );

      // Contribute to the project, enough to reach the goal
      await crowdfundingProject.connect(addr1).contribute(0, {
          value: ethers.utils.parseEther('7'),
      });
      await crowdfundingProject.connect(addr2).contribute(0, {
        value: ethers.utils.parseEther('3'),
      });

      // Increase time so that the deadline has passed
      await ethers.provider.send('evm_increaseTime', [ONE_DAY]);
      await ethers.provider.send('evm_mine'); // Mine the next block so the time change takes effect

      // Inject rewards after the deadline
      await crowdfundingProject.connect(owner).injectRewards(0, { 
        value: ethers.utils.parseEther('1')
      });

      // Claim rewards
      await crowdfundingProject.connect(addr1).claimRewards(0);
      const project = await crowdfundingProject.projects(0);

      expect(project.fundsInjected).to.equal(
        ethers.utils.parseEther('1')
      );
    });

    it('Should not be able to claim rewards twice', async function () {
        // Try to claim rewards again and verify the transaction fails
        await expect(crowdfundingProject.connect(addr1).claimRewards(0)).to.be.reverted;
    });

    it('Should not be able to claim rewards without funds injection', async function () {
        // Create new project with a future deadline
        await crowdfundingProject.createProject(
            'Test Project 2',
            'Test Description 2',
            ethers.utils.parseEther('10'),
            Math.floor(Date.now() / 1000) + DATE_III, // Ensure the deadline is in the future
            ethers.utils.parseEther('0.1'),
            0, // Ether as currency
            ethers.constants.AddressZero // Dummy ERC20 token address
        );

        // Contribute to the project
        await crowdfundingProject.connect(addr1).contribute(1, {
            value: ethers.utils.parseEther('5'),
        });

        // Try to claim rewards without funds injection and verify the transaction fails
        // No need to increase time here, as the contract should already prevent claiming without funds
        await expect(crowdfundingProject.connect(addr1).claimRewards(2)).to.be.reverted;
    });
  });

  describe ('Claiming Contributions - Part 1', function () {
    let CrowdfundingProject, crowdfundingProject, owner, addr1, addr2;

    beforeEach(async () => {
      [CrowdfundingProject, owner, addr1, addr2, crowdfundingProject] = await initializeCrowdfundingProject();
    });
      
    afterEach(async () => {
      await cleanupCrowdfundingProject();
    });

    it('Should allow contributors to claim back their contribution if goal is not met after deadline', async function () {
      // A project needs to be created first.
      await crowdfundingProject.createProject(
        'Test Project',
        'Test Description',
        ethers.utils.parseEther('10'),
        Math.floor(Date.now() / 1000) + DATE_III,
        ethers.utils.parseEther('0.1'),
        0, // Ether as currency
        ethers.constants.AddressZero // Dummy ERC20 token address
      );
      
      // Contribute to the project first.
      await crowdfundingProject.connect(addr1).contribute(0, {
          value: ethers.utils.parseEther('1'),
      });
  
      // Simulate deadline passing and project goal not met.
      await ethers.provider.send('evm_increaseTime', [ONE_DAY]);
      await ethers.provider.send('evm_mine');
  
      const beforeBalance = await ethers.provider.getBalance(addr1.address);
      await crowdfundingProject.connect(addr1).claimContribution(0);
      const afterBalance = await ethers.provider.getBalance(addr1.address);
  
      expect(afterBalance).to.gt(beforeBalance);
    });

    it('Should prevent the same contributor from claiming their contribution twice', async function () {
      // A project needs to be created first.
      await crowdfundingProject.createProject(
        'Test Project',
        'Test Description',
        ethers.utils.parseEther('10'),
        Math.floor(Date.now() / 1000) + DATE_IV,
        ethers.utils.parseEther('0.1'),
        0, // Ether as currency
        ethers.constants.AddressZero // Dummy ERC20 token address
      );

      // Contribute to the project first.
      await crowdfundingProject.connect(addr1).contribute(0, {
          value: ethers.utils.parseEther('1'),
      });

      // Simulate deadline passing and project goal not met.
      await ethers.provider.send('evm_increaseTime', [ONE_DAY]);
      await ethers.provider.send('evm_mine');
  
      await crowdfundingProject.connect(addr1).claimContribution(0);
  
      // Try to claim contribution again, should revert.
      await expect(crowdfundingProject.connect(addr1).claimContribution(0)).to.be.revertedWith('You have not made any contributions');
    });
  
    it('Should prevent contributors from claiming their contribution before deadline', async function () {
      // A project needs to be created first.
      await crowdfundingProject.createProject(
        'Test Project',
        'Test Description',
        ethers.utils.parseEther('10'),
        Math.floor(Date.now() / 1000) + DATE_V,
        ethers.utils.parseEther('0.1'),
        0, // Ether as currency
        ethers.constants.AddressZero // Dummy ERC20 token address
      );
  
      // Contribute to the project first.
      await crowdfundingProject.connect(addr1).contribute(0, {
          value: ethers.utils.parseEther('1'),
      });
  
      // Try to claim contribution before deadline, should revert.
      await expect(crowdfundingProject.connect(addr1).claimContribution(0)).to.be.revertedWith('Cannot claim contribution before deadline');
    });
  
    it('Should prevent contributors from claiming their contribution if project has reached its goal', async function () {
      // A project needs to be created first.
      await crowdfundingProject.createProject(
        'Test Project',
        'Test Description',
        ethers.utils.parseEther('10'),
        Math.floor(Date.now() / 1000) + DATE_V,
        ethers.utils.parseEther('0.1'),
        0, // Ether as currency
        ethers.constants.AddressZero // Dummy ERC20 token address
      );
      
      // Contribute to the project first.
      await crowdfundingProject.connect(addr1).contribute(0, {
          value: ethers.utils.parseEther('12'),
      });
  
      
      await ethers.provider.send('evm_increaseTime', [ONE_DAY]);
      await ethers.provider.send('evm_mine');
  
      // Try to claim contribution, should revert.
      await expect(crowdfundingProject.connect(addr1).claimContribution(0)).to.be.revertedWith('Cannot claim contribution if the project had reached the financial goal');
    });

    it('Should fail when contributing to a project where funds have been withdrawn', async function () {
      // A project needs to be created first.
      await crowdfundingProject.createProject(
        'Test Project',
        'Test Description',
        ethers.utils.parseEther('10'),
        Math.floor(Date.now() / 1000) + DATE_VI,
        ethers.utils.parseEther('0.1'),
        0, // Ether as currency
        ethers.constants.AddressZero // Dummy ERC20 token address
      );
    
      // Need to contribute to the project and then withdraw funds
      await crowdfundingProject.connect(addr1).contribute(0, {
        value: ethers.utils.parseEther('12'),
      });

      
      await ethers.provider.send('evm_increaseTime', [ONE_DAY]);
      await ethers.provider.send('evm_mine');

      await crowdfundingProject.connect(owner).withdrawFunds(0);

      // Attempt to contribute again
      await expect(crowdfundingProject.connect(addr1).contribute(0, {
        value: ethers.utils.parseEther('12'),
      })).to.be.revertedWith("The project funds have already been withdrawn");
    });

    it('Should fail when contributing to a project where the deadline has passed', async function () {
      // A project needs to be created first.
      await crowdfundingProject.createProject(
        'Test Project',
        'Test Description',
        ethers.utils.parseEther('10'),
        Math.floor(Date.now() / 1000) + DATE_VII,
        ethers.utils.parseEther('0.1'),
        0, // Ether as currency
        ethers.constants.AddressZero // Dummy ERC20 token address
      );

      
      await ethers.provider.send('evm_increaseTime', [ONE_DAY]);
      await ethers.provider.send('evm_mine');
    
      await expect(crowdfundingProject.connect(addr1).contribute(0, {
        value: ethers.utils.parseEther('12'),
      })).to.be.revertedWith("Deadline passed");
    });
    
    it('Should fail when the contribution does not meet the minimum requirement', async function () {
       // A project needs to be created first.
       await crowdfundingProject.createProject(
        'Test Project',
        'Test Description',
        ethers.utils.parseEther('10'),
        Math.floor(Date.now() / 1000) + DATE_VIII,
        ethers.utils.parseEther('0.1'),
        0, // Ether as currency
        ethers.constants.AddressZero // Dummy ERC20 token address
      );
    
      await expect(crowdfundingProject.connect(addr1).contribute(0, {
        value: ethers.utils.parseEther('0.05'), // Less than the minimum contribution
      })).to.be.revertedWith("Minimum contribution not met");
    });
  
    it('Should fail when the contribution in terms of ERC20 tokens doesn\'t meet the allowance', async function () {
      // Deploying the SimpleERC20 contract with an initial supply
      const ERC20 = await ethers.getContractFactory('SimpleERC20');
      const validToken = await ERC20.deploy(ethers.utils.parseEther('10000'));
      await validToken.deployed();
    
      // Setting the token as valid currency for the project
      await crowdfundingProject.setValidCurrency(validToken.address, true);
    
      // Creating a new project
      await crowdfundingProject.createProject(
        'Test Project',
        'Test Description',
        ethers.utils.parseEther('10'),
        Math.floor(Date.now() / 1000) + DATE_VIII,
        ethers.utils.parseEther('0.1'),
        1, // ERC20 as currencyType
        validToken.address // Valid ERC20 token address
      );
    
      // Transferring some tokens to addr1
      await validToken.transfer(addr1.address, ethers.utils.parseEther('1'));
    
      // Setting a lower allowance than the minimum contribution
      await validToken.connect(addr1).approve(crowdfundingProject.address, ethers.utils.parseEther('0.05'));
    
      const projectId = 0;
      await expect(crowdfundingProject.connect(addr1).contribute(projectId)).to.be.revertedWith("Minimum contribution not met");
    });
  });

  describe('Withdrawing Funds - Part 2', function () {
    let CrowdfundingProject, crowdfundingProject, owner, addr1, addr2;

    beforeEach(async () => {
      [CrowdfundingProject, owner, addr1, addr2, crowdfundingProject] = await initializeCrowdfundingProject();
    });
  
    afterEach(async () => {
      await cleanupCrowdfundingProject();
    });

    it('Should fail to withdraw funds when the project goal is not reached', async function () {
      // A project needs to be created first.
      await crowdfundingProject.createProject(
        'Test Project',
        'Test Description',
        ethers.utils.parseEther('10'),
        Math.floor(Date.now() / 1000) + DATE_VIII,
        ethers.utils.parseEther('0.1'),
        0, // Ether as currency
        ethers.constants.AddressZero // Dummy ERC20 token address
      );
      
      // contribute with address 1
      await crowdfundingProject.connect(addr1).contribute(0, {
        value: ethers.utils.parseEther('1'),
      });

      await ethers.provider.send('evm_increaseTime', [ONE_DAY]);
      await ethers.provider.send('evm_mine');

      await expect(crowdfundingProject.connect(owner).withdrawFunds(0)).to.be.revertedWith("Cannot withdraw before reaching goal");
    });

    it('Should fail to withdraw funds before the deadline', async function () {
      // A project needs to be created first.
      await crowdfundingProject.createProject(
        'Test Project',
        'Test Description',
        ethers.utils.parseEther('10'),
        Math.floor(Date.now() / 1000) + DATE_IX,
        ethers.utils.parseEther('0.1'),
        0, // Ether as currency
        ethers.constants.AddressZero // Dummy ERC20 token address
      );

      // contribute with address 1
      await crowdfundingProject.connect(addr1).contribute(0, {
        value: ethers.utils.parseEther('1'),
      });

      await expect(crowdfundingProject.connect(owner).withdrawFunds(0)).to.be.revertedWith("Cannot withdraw before deadline");
    });
    
    it('Should withdraw funds successfully for a project with ERC20 as currency', async function () {
      // Deploying the SimpleERC20 contract with an initial supply
      const ERC20 = await ethers.getContractFactory('SimpleERC20');
      const validToken = await ERC20.deploy(ethers.utils.parseEther('10000'));
      await validToken.deployed();
    
      // Setting the token as valid currency for the project
      await crowdfundingProject.setValidCurrency(validToken.address, true);
    
      // Creating a new project
      await crowdfundingProject.createProject(
        'Test Project',
        'Test Description',
        ethers.utils.parseEther('10'),
        Math.floor(Date.now() / 1000) + DATE_IX,
        ethers.utils.parseEther('0.1'),
        1, // ERC20 as currencyType
        validToken.address // Valid ERC20 token address
      );
    
      // Transferring some tokens to addr1 and contribute
      await validToken.transfer(addr1.address, ethers.utils.parseEther('12'));
      await validToken.connect(addr1).approve(crowdfundingProject.address, ethers.utils.parseEther('12'));
      await crowdfundingProject.connect(addr1).contribute(0);
    
      await ethers.provider.send('evm_increaseTime', [ONE_DAY]);
      await ethers.provider.send('evm_mine'); 
    
      await crowdfundingProject.connect(owner).withdrawFunds(0);
      const project = await crowdfundingProject.projects(0);
    
      expect(project.fundsWithdrawn).to.equal(true);
    });
  });

  describe('Injecting Rewards - Part 2', function () {
    let CrowdfundingProject, crowdfundingProject, owner, addr1, addr2;

    beforeEach(async () => {
      [CrowdfundingProject, owner, addr1, addr2, crowdfundingProject] = await initializeCrowdfundingProject();
    });
      
    afterEach(async () => {
      await cleanupCrowdfundingProject();
    });

    it('Should inject rewards successfully for a project with ERC20 as currency', async function () {
      // Deploying the SimpleERC20 contract with an initial supply
      const ERC20 = await ethers.getContractFactory('SimpleERC20');
      const validToken = await ERC20.deploy(ethers.utils.parseEther('10000'));
      await validToken.deployed();
    
      // Setting the token as valid currency for the project
      await crowdfundingProject.setValidCurrency(validToken.address, true);
    
      // Creating a new project
      await crowdfundingProject.createProject(
        'Test Project',
        'Test Description',
        ethers.utils.parseEther('10'),
        Math.floor(Date.now() / 1000) + DATE_X,
        ethers.utils.parseEther('0.1'),
        1, // ERC20 as currencyType
        validToken.address // Valid ERC20 token address
      );
    
      // Transferring some tokens to addr1 and contribute
      await validToken.transfer(addr1.address, ethers.utils.parseEther('15'));
      await validToken.connect(addr1).approve(crowdfundingProject.address, ethers.utils.parseEther('15'));
      await crowdfundingProject.connect(addr1).contribute(0);
    
      await ethers.provider.send('evm_increaseTime', [ONE_DAY]);
      await ethers.provider.send('evm_mine'); 
    
      // Transfer some tokens to owner for injecting rewards
      await validToken.transfer(owner.address, ethers.utils.parseEther('1'));
      await validToken.connect(owner).approve(crowdfundingProject.address, ethers.utils.parseEther('1'));
      
      // Inject rewards
      await crowdfundingProject.connect(owner).injectRewards(0);
    
      const project = await crowdfundingProject.projects(0);
    
      expect(project.fundsInjected).to.equal(ethers.utils.parseEther('1'));
    });

    it('Should fail to inject rewards before the deadline', async function () {
      // A project needs to be created first.
      await crowdfundingProject.createProject(
        'Test Project',
        'Test Description',
        ethers.utils.parseEther('10'),
        Math.floor(Date.now() / 1000) + DATE_XI,
        ethers.utils.parseEther('0.1'),
        0, // Ether as currency
        ethers.constants.AddressZero // Dummy ERC20 token address
      );
      
      // contribute with address 1
      await crowdfundingProject.connect(addr1).contribute(0, {
        value: ethers.utils.parseEther('10'),
      });
    
      await expect(crowdfundingProject.connect(owner).injectRewards(0)).to.be.revertedWith("Cannot inject funds before deadline");
    });
    
    it('Should fail to inject rewards when the project goal is not reached', async function () {
      // A project needs to be created first.
      await crowdfundingProject.createProject(
        'Test Project',
        'Test Description',
        ethers.utils.parseEther('10'),
        Math.floor(Date.now() / 1000) + DATE_XI,
        ethers.utils.parseEther('0.1'),
        0, // Ether as currency
        ethers.constants.AddressZero // Dummy ERC20 token address
      );

      // contribute with address 1
      await crowdfundingProject.connect(addr1).contribute(0, {
        value: ethers.utils.parseEther('1'),
      });
    
      await ethers.provider.send('evm_increaseTime', [ONE_DAY]);
      await ethers.provider.send('evm_mine'); 
    
      await expect(crowdfundingProject.connect(owner).injectRewards(0)).to.be.revertedWith("Cannot inject funds before reaching goal");
    });
  });

  describe('Claiming Rewards - Part 2', function () {
    let CrowdfundingProject, crowdfundingProject, owner, addr1, addr2;
    
    beforeEach(async () => {
      [CrowdfundingProject, owner, addr1, addr2, crowdfundingProject] = await initializeCrowdfundingProject();
    });
      
    afterEach(async () => {
      await cleanupCrowdfundingProject();
    });

    it('Should claim rewards successfully for a project with ERC20 as currency', async function () {
      // Deploying the SimpleERC20 contract with an initial supply
      const ERC20 = await ethers.getContractFactory('SimpleERC20');
      const validToken = await ERC20.deploy(ethers.utils.parseEther('10000'));
      await validToken.deployed();
    
      // Setting the token as valid currency for the project
      await crowdfundingProject.setValidCurrency(validToken.address, true);
    
      // Creating a new project
      await crowdfundingProject.createProject(
        'Test Project',
        'Test Description',
        ethers.utils.parseEther('10'),
        Math.floor(Date.now() / 1000) + DATE_XII,
        ethers.utils.parseEther('0.1'),
        1, // ERC20 as currencyType
        validToken.address // Valid ERC20 token address
      );
    
      // Transfer some tokens to addr1 and addr2 and they contribute
      await validToken.transfer(addr1.address, ethers.utils.parseEther('7'));
      await validToken.transfer(addr2.address, ethers.utils.parseEther('3'));
      await validToken.connect(addr1).approve(crowdfundingProject.address, ethers.utils.parseEther('7'));
      await validToken.connect(addr2).approve(crowdfundingProject.address, ethers.utils.parseEther('3'));
      await crowdfundingProject.connect(addr1).contribute(0);
      await crowdfundingProject.connect(addr2).contribute(0);
    
      await ethers.provider.send('evm_increaseTime', [ONE_DAY]);
      await ethers.provider.send('evm_mine'); 
    
      // Transfer some tokens to owner for injecting rewards
      await validToken.transfer(owner.address, ethers.utils.parseEther('1'));
      await validToken.connect(owner).approve(crowdfundingProject.address, ethers.utils.parseEther('1'));
      
      // Inject rewards
      await crowdfundingProject.connect(owner).injectRewards(0);
    
      // Claim rewards
      await crowdfundingProject.connect(addr1).claimRewards(0);
      const project = await crowdfundingProject.projects(0);
    
      expect(project.fundsInjected).to.equal(ethers.utils.parseEther('1'));
    });
    
    it('Should fail to claim rewards before the deadline', async function () {
      // A project needs to be created first.
      await crowdfundingProject.createProject(
        'Test Project',
        'Test Description',
        ethers.utils.parseEther('10'),
        Math.floor(Date.now() / 1000) + DATE_XIII,
        ethers.utils.parseEther('0.1'),
        0, // Ether as currency
        ethers.constants.AddressZero // Dummy ERC20 token address
      );

      // contribute with address 1
      await crowdfundingProject.connect(addr1).contribute(0, {
        value: ethers.utils.parseEther('10'),
      });
    
      await expect(crowdfundingProject.connect(addr1).claimRewards(0)).to.be.revertedWith("Cannot claim rewards before deadline");
    });
    
    it('Should fail to claim rewards when the project goal is not reached', async function () {
        // A project needs to be created first.
        await crowdfundingProject.createProject(
        'Test Project',
        'Test Description',
        ethers.utils.parseEther('10'),
        Math.floor(Date.now() / 1000) + DATE_XIII,
        ethers.utils.parseEther('0.1'),
        0, // Ether as currency
        ethers.constants.AddressZero // Dummy ERC20 token address
      );

      // contribute with address 1
      await crowdfundingProject.connect(addr1).contribute(0, {
        value: ethers.utils.parseEther('5'),
      });
    
      await ethers.provider.send('evm_increaseTime', [ONE_DAY]);
      await ethers.provider.send('evm_mine'); 
    
      await expect(crowdfundingProject.connect(addr1).claimRewards(0)).to.be.revertedWith("Cannot claim rewards before reaching goal");
    });      
  });

  describe ('Claiming Contributions - Part 2', function () {
    let CrowdfundingProject, crowdfundingProject, owner, addr1, addr2;

    beforeEach(async () => {
      [CrowdfundingProject, owner, addr1, addr2, crowdfundingProject] = await initializeCrowdfundingProject();
    });
  
    afterEach(async () => {
      await cleanupCrowdfundingProject();
    });

    it('Should allow contributors to claim back their ERC20 contribution if goal is not met after deadline', async function () {
      // Deploying the SimpleERC20 contract with an initial supply
      const ERC20 = await ethers.getContractFactory('SimpleERC20');
      const validToken = await ERC20.deploy(ethers.utils.parseEther('10000'));
      await validToken.deployed();
    
      // Setting the token as valid currency for the project
      await crowdfundingProject.setValidCurrency(validToken.address, true);
    
      // Creating a new project
      await crowdfundingProject.createProject(
        'Test Project',
        'Test Description',
        ethers.utils.parseEther('10'),
        Math.floor(Date.now() / 1000) + DATE_XIV,
        ethers.utils.parseEther('0.1'),
        1, // ERC20 as currencyType
        validToken.address // Valid ERC20 token address
      );
    
      // Transferring some tokens to addr1
      await validToken.transfer(addr1.address, ethers.utils.parseEther('1'));
    
      // Approve the tokens for the contract and contribute
      await validToken.connect(addr1).approve(crowdfundingProject.address, ethers.utils.parseEther('1'));
      await crowdfundingProject.connect(addr1).contribute(0);
    
      // Simulate deadline passing and project goal not met.
      await ethers.provider.send('evm_increaseTime', [ONE_DAY]);
      await ethers.provider.send('evm_mine');
    
      // Before balance
      const beforeBalance = await validToken.balanceOf(addr1.address);
    
      // Claim contribution
      await crowdfundingProject.connect(addr1).claimContribution(0);
    
      // After balance
      const afterBalance = await validToken.balanceOf(addr1.address);
    
      expect(afterBalance).to.gt(beforeBalance);
    });
    
    it('Should prevent the same contributor from claiming their ERC20 contribution twice', async function () {
      // Deploying the SimpleERC20 contract with an initial supply
      const ERC20 = await ethers.getContractFactory('SimpleERC20');
      const validToken = await ERC20.deploy(ethers.utils.parseEther('10000'));
      await validToken.deployed();
    
      // Setting the token as valid currency for the project
      await crowdfundingProject.setValidCurrency(validToken.address, true);
    
      // Creating a new project
      await crowdfundingProject.createProject(
        'Test Project',
        'Test Description',
        ethers.utils.parseEther('10'),
        Math.floor(Date.now() / 1000) + DATE_XV,
        ethers.utils.parseEther('0.1'),
        1, // ERC20 as currencyType
        validToken.address // Valid ERC20 token address
      );
    
      // Transferring some tokens to addr1
      await validToken.transfer(addr1.address, ethers.utils.parseEther('1'));
    
      // Approve the tokens for the contract and contribute
      await validToken.connect(addr1).approve(crowdfundingProject.address, ethers.utils.parseEther('1'));
      await crowdfundingProject.connect(addr1).contribute(0);
    
      // Simulate deadline passing and project goal not met.
      await ethers.provider.send('evm_increaseTime', [ONE_DAY]);
      await ethers.provider.send('evm_mine');
    
      // Claim contribution
      await crowdfundingProject.connect(addr1).claimContribution(0);
    
      // Try to claim contribution again, should revert.
      await expect(crowdfundingProject.connect(addr1).claimContribution(0)).to.be.revertedWith('You have not made any contributions');
    });    
  });

  describe('Platform Fee Withdrawal', function () {
    let CrowdfundingProject, crowdfundingProject, owner, addr1, addr2;
  
    beforeEach(async () => {
      [CrowdfundingProject, owner, addr1, addr2, crowdfundingProject] = await initializeCrowdfundingProject();
    });
  
    afterEach(async () => {
      await cleanupCrowdfundingProject();
    });
  
    it('Should only allow owner to withdraw the platform fee', async function () {
      await crowdfundingProject.createProject(
        'Test Project',
        'Test Description',
        ethers.utils.parseEther('10'),
        Math.floor(Date.now() / 1000) + DATE_XVI,
        ethers.utils.parseEther('0.1'),
        0, // Ether as currency
        ethers.constants.AddressZero
      );

      await expect(crowdfundingProject.connect(addr1).withdrawPlatformFee(0, ethers.constants.AddressZero)).to.be.revertedWith("Ownable: caller is not the owner");
    });
    
    it('Should allow the platform owner to withdraw platform fees (Ether)', async function () {
      await crowdfundingProject.connect(addr2).createProject(
        'Test Project',
        'Test Description',
        ethers.utils.parseEther('10'),
        Math.floor(Date.now() / 1000) + DATE_XVI,
        ethers.utils.parseEther('0.1'),
        0, // Ether as currency
        ethers.constants.AddressZero,
      );
      
      // contribute with address 1
      await crowdfundingProject.connect(addr1).contribute(0, {
        value: ethers.utils.parseEther('10'),
      });

      await ethers.provider.send('evm_increaseTime', [ONE_DAY]);
      await ethers.provider.send('evm_mine');

      // Owner withdraws the funds after goal is met and deadline is passed
      await crowdfundingProject.connect(addr2).withdrawFunds(0);
  
      const beforeBalance = await ethers.provider.getBalance(owner.address);
      await crowdfundingProject.withdrawPlatformFee(0, ethers.constants.AddressZero);
      const afterBalance = await ethers.provider.getBalance(owner.address);
  
      expect(afterBalance).to.gt(beforeBalance);
    });

    it('Should allow the platform owner to withdraw platform fees (ERC20)', async function () {
      // Deploying the SimpleERC20 contract with an initial supply
      const ERC20 = await ethers.getContractFactory('SimpleERC20');
      const validToken = await ERC20.deploy(ethers.utils.parseEther('10000'));
      await validToken.deployed();
      
      // Setting the token as valid currency for the project
      await crowdfundingProject.setValidCurrency(validToken.address, true);
    
      // Creating a new project
      await crowdfundingProject.connect(addr2).createProject(
        'Test Project',
        'Test Description',
        ethers.utils.parseEther('10'),
        Math.floor(Date.now() / 1000) + DATE_XVII,
        ethers.utils.parseEther('0.1'),
        1, // ERC20 as currencyType
        validToken.address // Valid ERC20 token address
      );
    
      // Transferring some tokens to addr1
      await validToken.transfer(addr1.address, ethers.utils.parseEther('15'));
      
      // Approve the tokens for the contract and contribute
      await validToken.connect(addr1).approve(crowdfundingProject.address, ethers.utils.parseEther('15'));
      await crowdfundingProject.connect(addr1).contribute(0, {
        value: ethers.utils.parseEther('0'),
      });
    
      await ethers.provider.send('evm_increaseTime', [ONE_DAY]);
      await ethers.provider.send('evm_mine');
    
      // Owner withdraws the funds after goal is met and deadline is passed
      await crowdfundingProject.connect(addr2).withdrawFunds(0);
      
      const beforeBalance = await validToken.balanceOf(owner.address);
      await crowdfundingProject.withdrawPlatformFee(1, validToken.address);
      const afterBalance = await validToken.balanceOf(owner.address);
      
      expect(afterBalance).to.gt(beforeBalance);
    });

    it('Should prevent platform owner from withdrawing fees if none are available', async function () {
      // Creating a new project
      await crowdfundingProject.connect(addr2).createProject(
        'Test Project',
        'Test Description',
        ethers.utils.parseEther('10'),
        Math.floor(Date.now() / 1000) + DATE_XVIII,
        ethers.utils.parseEther('0.1'),
        0, // Ether as currency
        ethers.constants.AddressZero,
      );
    
      // addr1 contributes but doesn't meet the goal
      await crowdfundingProject.connect(addr1).contribute(0, {
        value: ethers.utils.parseEther('5'),
      });
    
      await ethers.provider.send('evm_increaseTime', [ONE_DAY]);
      await ethers.provider.send('evm_mine');
    
      // Owner can't withdraw funds as goal is not met
      await expect(crowdfundingProject.connect(addr2).withdrawFunds(0)).to.be.revertedWith("Cannot withdraw before reaching goal");
    
      // Therefore no fees should be available for withdrawal
      await expect(crowdfundingProject.withdrawPlatformFee(0, ethers.constants.AddressZero)).to.be.revertedWith('No Ether fees to withdraw');
    });
    
    it('Should prevent platform owner from withdrawing fees of an unsupported ERC20 token', async function () {
      // Deploying the SimpleERC20 contract with an initial supply
      const ERC20 = await ethers.getContractFactory('SimpleERC20');
      const validToken = await ERC20.deploy(ethers.utils.parseEther('10000'));
      const invalidToken = await ERC20.deploy(ethers.utils.parseEther('10000'));
      await validToken.deployed();
      await invalidToken.deployed();
    
      // Setting the token as valid currency for the project
      await crowdfundingProject.setValidCurrency(validToken.address, true);
    
      // Creating a new project
      await crowdfundingProject.connect(addr2).createProject(
        'Test Project',
        'Test Description',
        ethers.utils.parseEther('10'),
        Math.floor(Date.now() / 1000) + DATE_XIX,
        ethers.utils.parseEther('0.1'),
        1, // ERC20 as currencyType
        validToken.address // Valid ERC20 token address
      );
    
      // Transferring some tokens to addr1
      await validToken.transfer(addr1.address, ethers.utils.parseEther('15'));
    
      // Approve the tokens for the contract and contribute
      await validToken.connect(addr1).approve(crowdfundingProject.address, ethers.utils.parseEther('15'));
      await crowdfundingProject.connect(addr1).contribute(0, {
        value: ethers.utils.parseEther('0'),
      });
    
      await ethers.provider.send('evm_increaseTime', [ONE_DAY]);
      await ethers.provider.send('evm_mine');
    
      // Owner withdraws the funds after goal is met and deadline is passed
      await crowdfundingProject.connect(addr2).withdrawFunds(0);
    
      // Try to withdraw fees using an unsupported ERC20 token
      await expect(crowdfundingProject.withdrawPlatformFee(1, invalidToken.address)).to.be.revertedWith('Invalid currency. Only Ether or supported ERC20 tokens are accepted');
    });
  });

});
