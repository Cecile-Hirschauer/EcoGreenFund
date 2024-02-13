const {ethers} = require('hardhat')
const {expect, assert} = require('chai')

describe('EcoFundChain Tests', function () {
    let ECFContract;
    let owner, addr1, addr2, addr3;

    beforeEach(async function () {
        [owner, addr1, addr2, addr3] = await ethers.getSigners();
        const Crowdfunding = await ethers.getContractFactory('EcoFundChain');
        ECFContract = await Crowdfunding.deploy();
    })

    it("Should deploy the smart contract with the right Owner", async function () {
        let admin = await ECFContract.owner()
        assert.equal(admin, owner.address)
    })

    describe('Campaign management tests', function () {

        // Add Campaign
        it('Should revert if the goal is less than 1', async function () {
            await expect(ECFContract.addCampaign(
                0, // _goal
                "Test Campaign", // _name
                "Test Description", // _description
                "Test ImageUrl" // _imageUrl
            )).to.be.revertedWith("Crowdfunding: goal must be greater than 0");
        })

        it('Should revert if the name is empty', async function () {
            await expect(ECFContract.addCampaign(
                100, // _goal
                "", // _name
                "Test Description", // _description
                "Test ImageUrl" // _imageUrl
            )).to.be.revertedWith("Crowdfunding: name cannot be empty");
        })

        it('Should revert if the description is empty', async function () {
            await expect(ECFContract.addCampaign(
                100, // _goal
                "Test Campaign", // _name
                "", // _description
                "Test ImageUrl" // _imageUrl
            )).to.be.revertedWith("Crowdfunding: description cannot be empty");
        })

        it('Should revert if the imageUrl is empty', async function () {
            await expect(ECFContract.addCampaign(
                100, // _goal
                "Test Campaign", // _name
                "Test Description", // _description
                "" // _imageUrl
            )).to.be.revertedWith("Crowdfunding: imageUrl cannot be empty");
        })

        it('Should add a campaign', async function () {
            await ECFContract.addCampaign(
                100, // _goal
                "Test Campaign", // _name
                "Test Description", // _description
                "Test ImageUrl" // _imageUrl
            )
            let campaign = await ECFContract.campaigns(0)
            assert.equal(campaign.goal, 100)
            assert.equal(campaign.name, "Test Campaign")
            assert.equal(campaign.description, "Test Description")
            assert.equal(campaign.imageUrl, "Test ImageUrl")
        })

        it('Should emit a CampaignAdded event with the correct information', async function () {
            await expect(ECFContract.connect(addr1).addCampaign(
                100, // _goal
                "Test Campaign", // _name
                "Test Description", // _description
                "Test ImageUrl" // _imageUrl
            ))
                .to.emit(ECFContract, 'CampaignAdded')
                .withArgs(
                    0,
                    addr1.address,
                    "Test Campaign",
                    100
                );
        });

        describe('Get and update Campaign', function () {
            beforeEach(async function () {
                await ECFContract.connect(addr1).addCampaign(
                    100, // _goal
                    "Test Campaign", // _name
                    "Test Description", // _description
                    "Test ImageUrl" // _imageUrl
                )
            })

            it('Should revert if the campaign does not exist', async function () {
                await expect(ECFContract.getCampaign(1))
                    .to.be.revertedWith("Campaign does not exist")
            })

            it('Should get the campaign information', async function () {
                let campaign = await ECFContract.getCampaign(0)
                assert.equal(campaign.goal, 100)
                assert.equal(campaign.name, "Test Campaign")
                assert.equal(campaign.description, "Test Description")
                assert.equal(campaign.imageUrl, "Test ImageUrl")
            })

            it('Should revert if the campaign is not updated by its creator or the owner', async function () {
                await expect(ECFContract.connect(addr2).updateCampaign(
                    0,
                    200, // _goal
                    "Updated Test Campaign", // _name
                    "Updated Test Description", // _description
                    "Updated Test ImageUrl" // _imageUrl
                )).to.be.revertedWith("Caller is not the creator or the owner");
            })

            it('Should update the campaign information', async function () {
                await ECFContract.connect(addr1).addCampaign(
                    100, // _goal
                    "Test Campaign", // _name
                    "Test Description", // _description
                    "Test ImageUrl" // _imageUrl
                )
                await ECFContract.connect(addr1).updateCampaign(
                    0,
                    200, // _goal
                    "Updated Test Campaign", // _name
                    "Updated Test Description", // _description
                    "Updated Test ImageUrl" // _imageUrl
                )
                let campaign = await ECFContract.campaigns(0)
                assert.equal(campaign.goal, 200)
                assert.equal(campaign.name, "Updated Test Campaign")
                assert.equal(campaign.description, "Updated Test Description")
                assert.equal(campaign.imageUrl, "Updated Test ImageUrl")
            })

            it('Should emit a CampaignUpdated event with the correct information', async function () {
                await expect(ECFContract.connect(addr1).updateCampaign(
                    0,
                    200, // _goal
                    "Updated Test Campaign", // _name
                    "Updated Test Description", // _description
                    "Updated Test ImageUrl" // _imageUrl
                ))
                    .to.emit(ECFContract, 'CampaignUpdated')
                    .withArgs(
                        0,
                        addr1.address,
                        "Updated Test Campaign",
                        200
                    );
            })
        })

        describe('Campaign success status tests', function () {
            it('Should revert if the campaign does not exist', async function () {
                await expect(ECFContract.modifyCampaignSuccessStatus(1, true))
                    .to.be.revertedWith("Campaign does not exist");
            });

            it('Should revert if the campaign is not updated by its creator or the owner', async function () {
                await ECFContract.connect(addr1).addCampaign(
                    100, // _goal
                    "Test Campaign", // _name
                    "Test Description", // _description
                    "Test ImageUrl" // _imageUrl
                )
                await expect(ECFContract.connect(addr2).modifyCampaignSuccessStatus(0, true))
                    .to.be.revertedWith("Caller is not the creator or the owner");
            });

            it('Should update the campaign success status', async function () {
                await ECFContract.connect(addr1).addCampaign(
                    100, // _goal
                    "Test Campaign", // _name
                    "Test Description", // _description
                    "Test ImageUrl" // _imageUrl
                )

                await expect(ECFContract.connect(addr1).modifyCampaignSuccessStatus(0, true))
                    .to.emit(ECFContract, 'CampaignSuccessStatusChanged')
                    .withArgs(0, true);

                let campaign = await ECFContract.campaigns(0);
                assert.equal(campaign.isSuccessful, true);
            });

        })


    })

    describe('Token authorisation tests', function () {
        let tokenAddress;

        beforeEach(async function () {
            tokenAddress = addr2.address;
        });



        it('Should allow the owner to authorise a token', async function () {
            await expect(ECFContract.connect(owner).setAuthorisedToken(tokenAddress, true))
                .to.emit(ECFContract, 'TokenAuthorisationChanged')
                .withArgs(tokenAddress, true);

            expect(await ECFContract.isAuthorisedToken(tokenAddress)).to.equal(true);
        });

        it('Should revert if is not the owner try to authorise the token', async function () {
            await expect(ECFContract.connect(addr1).setAuthorisedToken(tokenAddress, true))
                .to.be.revertedWithCustomError(ECFContract, "OwnableUnauthorizedAccount")
                .withArgs(addr1.address);

            expect(await ECFContract.isAuthorisedToken(tokenAddress)).to.equal(false);
        });

        it('Should allow the owner to unauthorise a token', async function () {
            await ECFContract.connect(owner).setAuthorisedToken(tokenAddress, true);

            await expect(ECFContract.unsetAuthorisedToken(tokenAddress))
                .to.emit(ECFContract, 'TokenAuthorisationChanged')
                .withArgs(tokenAddress, false);

            expect(await ECFContract.isAuthorisedToken(tokenAddress)).to.equal(false);
        });

        it('Should revert to unauthaurise token if is not the owner', async function () {
            await ECFContract.setAuthorisedToken(tokenAddress, true);

            await expect(ECFContract.connect(addr1).setAuthorisedToken(tokenAddress, true))
                .to.be.revertedWithCustomError(ECFContract, "OwnableUnauthorizedAccount")
                .withArgs(addr1.address);

            expect(await ECFContract.isAuthorisedToken(tokenAddress)).to.equal(true);
        });

        it('Should accurately report authorisation status', async function () {
            expect(await ECFContract.isAuthorisedToken(tokenAddress)).to.equal(false);

            await ECFContract.connect(owner).setAuthorisedToken(tokenAddress, true);
            expect(await ECFContract.isAuthorisedToken(tokenAddress)).to.equal(true);

            await ECFContract.connect(owner).unsetAuthorisedToken(tokenAddress);
            expect(await ECFContract.isAuthorisedToken(tokenAddress)).to.equal(false);
        });
    });

    describe("Contribution tests", function () {
        let mockERC20;

        beforeEach(async function () {
            const MockERC20 = await ethers.getContractFactory("MockERC20");
            mockERC20 = await MockERC20.deploy("MockToken", "MTK");

            await ECFContract.connect(owner).setAuthorisedToken(mockERC20.target, true);
        });

        it("Should revert if the campaign does not exist", async function () {
            await expect(ECFContract.connect(addr1).contributeWithEther(0, { value: ethers.parseEther("1") }))
                .to.be.revertedWith("Campaign is not active or already successful");
        });

        it("Should revert if the campaign is successful", async function () {
            await ECFContract.connect(owner).addCampaign(100, "Campaign 1", "Description 1", "URL 1");
            await ECFContract.modifyCampaignSuccessStatus(0, true);

            await expect(ECFContract.connect(addr1).contributeWithEther(0, { value: ethers.parseEther("1") }))
                .to.be.revertedWith("Campaign is not active or already successful");
        });

        it("Should revert if the contribution amount is zero", async function () {
            await ECFContract.connect(owner).addCampaign(100, "Campaign 1", "Description 1", "URL 1");
            await expect(ECFContract.connect(addr1).contributeWithEther(0, { value: ethers.parseEther("0") }))
                .to.be.revertedWith("Amount must be greater than 0");
        });

        it('Should revert if token is not authorised', async function () {
            await ECFContract.connect(owner).addCampaign(100, "Campaign 1", "Description 1", "URL 1");

            await mockERC20.mint(addr1.address, ethers.parseUnits("100", 18));

            const contributionAmount = ethers.parseUnits("10", 18);
            await mockERC20.connect(addr1).approve(ECFContract.target, contributionAmount);

            await expect(ECFContract.connect(addr1).contributeWithToken(0, contributionAmount, addr1.address))
                .to.be.revertedWith("Token not accepted");
        });

        it("Should allow staking with authorised tokens", async function () {
            await ECFContract.connect(owner).addCampaign(100, "Campaign 1", "Description 1", "URL 1");

            await mockERC20.mint(addr1.address, ethers.parseUnits("100", 18));

            // Approve le contrat Crowdfunding pour dépenser des tokens de l'adresse addr1
            const contributionAmount = ethers.parseUnits("10", 18);
            await mockERC20.connect(addr1).approve(ECFContract.target, contributionAmount);

            await expect(ECFContract.connect(addr1).contributeWithToken(0, contributionAmount, mockERC20.target))
                .to.emit(ECFContract, "ContributionMade")
                .withArgs(0, addr1.address, contributionAmount, mockERC20.target);
        });

        it("Should allow contributions with Ether", async function () {
            await ECFContract.connect(owner).addCampaign(100, "Campaign 1", "Description 1", "URL 1");

            const contributionAmount = ethers.parseEther("1");
            await expect(ECFContract.connect(addr1).contributeWithEther(0, { value: contributionAmount }))
                .to.emit(ECFContract, "ContributionMade")
                .withArgs(0, addr1.address, contributionAmount, "0x0000000000000000000000000000000000000000");
        });

        it("Should refund ERC20 token contribution", async function () {
            await ECFContract.connect(owner).addCampaign(100, "Campaign 1", "Description 1", "URL 1");
            await mockERC20.mint(addr1.address, ethers.parseUnits("1", 18));

            const contributionAmount = ethers.parseEther("1");
            await ECFContract.connect(addr1).contributeWithEther(0, { value: contributionAmount });

            await ECFContract.modifyCampaignSuccessStatus(0, false);
            // Simulate the contribution with ERC20 tokens
            await mockERC20.connect(addr1).approve(ECFContract.target, contributionAmount);
            await ECFContract.connect(addr1).contributeWithToken(0, contributionAmount, mockERC20.target);

            // Set the campaign to be unsuccessful
            await ECFContract.modifyCampaignSuccessStatus(0, false);

            // Refund the contribution
            await expect(ECFContract.connect(addr1).refund(0))
                .to.emit(ECFContract, 'Refunded')
                .withArgs(0, addr1.address, contributionAmount, mockERC20.target);

            // Check that the contributor's balance of the token has increased by the contribution amount
            expect(await mockERC20.balanceOf(addr1.address)).to.equal(contributionAmount);

            // Check that the contribution amount for addr1 in the contract is now zero
            let contribution = await ECFContract.contributions(0, addr1.address);
            expect(contribution.amount).to.equal(0);
        });

        it("Should not allow refunds for successful campaigns", async function () {
            await ECFContract.connect(owner).addCampaign(100, "Campaign 1", "Description 1", "URL 1");
            await mockERC20.mint(addr1.address, ethers.parseUnits("100", 18));

            const contributionAmount = ethers.parseEther("1");
            await ECFContract.connect(addr1).contributeWithEther(0, { value: contributionAmount });

            await ECFContract.modifyCampaignSuccessStatus(0, true);

            await expect(ECFContract.connect(addr1).refund(0))
                .to.be.revertedWith("Campaign is successful, no refunds");
        });


        it("Should allow refunds for non-successful campaigns", async function () {
            await ECFContract.connect(owner).addCampaign(100, "Campaign 1", "Description 1", "URL 1");
            await mockERC20.mint(addr1.address, ethers.parseUnits("100", 18));

            const contributionAmount = ethers.parseEther("1");
            await ECFContract.connect(addr1).contributeWithEther(0, { value: contributionAmount });


            await ECFContract.modifyCampaignSuccessStatus(0, false);

            await expect(ECFContract.connect(addr1).refund(0))
                .to.emit(ECFContract, "Refunded")
                .withArgs(0, addr1.address, contributionAmount, "0x0000000000000000000000000000000000000000");
        });
    });

})