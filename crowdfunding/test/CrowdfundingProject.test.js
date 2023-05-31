const { expect } = require('chai');
const { ethers } = require('hardhat');

const ONE_DAY = 86400;

describe('CrowdfundingProject', function () {
  let CrowdfundingProject, crowdfundingProject, owner, addr1, addr2;

  before(async () => {
    CrowdfundingProject = await ethers.getContractFactory(
      'CrowdfundingProject'
    );
    [owner, addr1, addr2, _] = await ethers.getSigners();
    crowdfundingProject = await CrowdfundingProject.deploy();
  });

  describe('Deployment', function () {
    it('Should set the right owner', async function () {
      expect(await crowdfundingProject.owner()).to.equal(owner.address);
    });

    it('Should set the platform fee to default', async function () {
      expect(await crowdfundingProject.fee()).to.equal(5);
    });
  });

  describe('Creating a project', function () {
    it('Should create a project successfully', async function () {
      await crowdfundingProject.createProject(
        'Test Project',
        'Test Description',
        ethers.utils.parseEther('10'),
        Math.floor(Date.now() / 1000) + ONE_DAY,
        ethers.utils.parseEther('0.1'),
        0, // Ether as currency
        '0x0000000000000000000000000000000000000000' // Dummy ERC20 token address
      );
      const project = await crowdfundingProject.projects(0);
      expect(project.name).to.equal('Test Project');
    });

    // Add more tests for different scenarios...
  });

  describe('Setting Platform Fee', function () {
    it('Should set the platform fee successfully', async function () {
      await crowdfundingProject.connect(owner).setPlatformFee(10);
      expect(await crowdfundingProject.fee()).to.equal(10);
    });
  });

  describe('Setting Valid Currency', function () {
    let validToken;

    beforeEach(async function () {
      const ERC20 = await ethers.getContractFactory('SimpleERC20');
      validToken = await ERC20.deploy(ethers.utils.parseEther('10000'));
      await validToken.deployed();
    });

    it('Should set valid currency successfully', async function () {
      await crowdfundingProject
        .connect(owner)
        .setValidCurrency(validToken.address, true);
      expect(
        await crowdfundingProject.validERC20Tokens(validToken.address)
      ).to.equal(true);
    });
  });

  describe('Contributing to a project', function () {
    it('Should contribute to a project successfully', async function () {
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

  describe('Withdrawing Funds', function () {
    it('Should withdraw funds successfully', async function () {
      await crowdfundingProject.connect(addr1).contribute(0, {
        value: ethers.utils.parseEther('12'),
      });

      // 2 days have passed the project was created so the deadline has passed.
      await ethers.provider.send('evm_increaseTime', [2 * ONE_DAY]);
      await ethers.provider.send('evm_mine'); // Mine the next block so the time change takes effect

      // Assumes sufficient contributions to the project.
      await crowdfundingProject.connect(owner).withdrawFunds(0);

      const project = await crowdfundingProject.projects(0);

      expect(project.fundsWithdrawn).to.equal(true);
    });
  });

  describe('Injecting Rewards', function () {
    it('Should inject rewards successfully', async function () {
      await crowdfundingProject
        .connect(owner)
        .injectRewards(0, { value: ethers.utils.parseEther('1') });
      const project = await crowdfundingProject.projects(0);
      expect(project.fundsInjected).to.equal(ethers.utils.parseEther('1'));
    });
  });

  // describe('Claiming Rewards', function () {
  //   it('Should claim rewards successfully', async function () {
  //    ...
  //   });
  // });

  // describe('Claiming Contributions', function () {
  //   it('Should claim contributions successfully', async function () {
  //     ...
  //   });
  // });

  // describe('Withdrawing Platform Fee', function () {
  //   it('Should withdraw platform fee successfully', async function () {
  //     ...
  //   });
  // });
});
