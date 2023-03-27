import { Clarinet, Tx, types } from 'https://deno.land/x/clarinet@v1.0.6/index.ts';
import { assertEquals, assertStringIncludes } from 'https://deno.land/std@0.90.0/testing/asserts.ts';
import { launch, pledge, pledgeAmountEmpty, pledgeAmountLessThan500, getCampaign, unpledge, unpledgeMoreThanPledged, unpledgeAll, getInvestment, refund, pledgeAmountGreaterThanGoal } from '../helpers/clearfund.ts';
function setup() {
    description: "Crowdfunding is a way to raise money for an individual or organization by collecting donations through family, friends, friends of friends, strangers, businesses, and more.";
}
// TEST CASES
// LAUNCHING A CAMPAIGN
// a user should be able to launch a new campaign
Clarinet.test({
    name: "A user should be able to launch a new campaign",
    async fn (chain, accounts) {
        const wallet_1 = accounts.get("wallet_1").address;
        let block = chain.mineBlock([
            Tx.contractCall('clearfund', 'launch', [
                types.utf8('Test Campaign'),
                types.buff('This is a campaign that I made.'),
                types.utf8('https://example.com'),
                types.uint(10000),
                types.uint(2),
                types.uint(100)
            ], wallet_1)
        ]);
        const result = block.receipts[0].result;
        result.expectOk().expectUint(1);
    }
});
// a user should be able to view campaign information
Clarinet.test({
    name: "A user should be able to view campaign information",
    async fn (chain, accounts) {
        const wallet_1 = accounts.get("wallet_1").address;
        let block = chain.mineBlock([
            Tx.contractCall('clearfund', 'launch', [
                types.utf8('Test Campaign'),
                types.buff('This is a campaign that I made.'),
                types.utf8('https://example.com'),
                types.uint(10000),
                types.uint(2),
                types.uint(100)
            ], wallet_1)
        ]);
        const newCampaign = chain.callReadOnlyFn('clearfund', 'get-campaign', [
            types.uint(1)
        ], wallet_1);
        const expectedCampaign = newCampaign.result;
        expectedCampaign.expectOk();
        assertEquals(expectedCampaign, '(ok {campaignOwner: ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5, claimed: false, description: 0x5468697320697320612063616d706169676e20746861742049206d6164652e, endsAt: u100, fundGoal: u10000, link: u"https://example.com", pledgedAmount: u0, pledgedCount: u0, startsAt: u2, targetReached: false, targetReachedBy: u0, title: u"Test Campaign"})');
    }
});
// a user should not be able to launch a campaign with a fundGoal of 0
Clarinet.test({
    name: "a user should not be able to launch a campaign without a fundGoal",
    async fn (chain, accounts) {
        const wallet_1 = accounts.get("wallet_1").address;
        let block = chain.mineBlock([
            Tx.contractCall('clearfund', 'launch', [
                types.utf8('Test Campaign'),
                types.buff('This is a campaign that I made.'),
                types.utf8('https://example.com'),
                types.uint(0),
                types.uint(2),
                types.uint(100)
            ], wallet_1)
        ]);
        const result = block.receipts[0].result;
        result.expectErr().expectUint(102);
    }
});
// a user should not be able to launch a campaign without a title, description, or link
Clarinet.test({
    name: "a user should not be able to launch a campaign without a title, description, or link",
    async fn (chain, accounts) {
        const wallet_1 = accounts.get("wallet_1").address;
        let block = chain.mineBlock([
            Tx.contractCall('clearfund', 'launch', [
                types.utf8(''),
                types.buff('This is a campaign that I made.'),
                types.utf8('https://example.com'),
                types.uint(10000),
                types.uint(2),
                types.uint(100)
            ], wallet_1)
        ]);
        const result = block.receipts[0].result;
        result.expectErr().expectUint(101);
        let block2 = chain.mineBlock([
            Tx.contractCall('clearfund', 'launch', [
                types.utf8('Name'),
                types.buff(''),
                types.utf8('https://example.com'),
                types.uint(10000),
                types.uint(2),
                types.uint(100)
            ], wallet_1)
        ]);
        const result2 = block2.receipts[0].result;
        result.expectErr().expectUint(101);
        let block3 = chain.mineBlock([
            Tx.contractCall('clearfund', 'launch', [
                types.utf8('Name'),
                types.buff('This is a campaign that I made.'),
                types.utf8(''),
                types.uint(10000),
                types.uint(2),
                types.uint(100)
            ], wallet_1)
        ]);
        const result3 = block3.receipts[0].result;
        result.expectErr().expectUint(101);
    }
});
// a user should not be able to launch a campaign starting sooner than current block
Clarinet.test({
    name: "a user should not be able to launch a campaign starting sooner than current block",
    async fn (chain, accounts) {
        const wallet_1 = accounts.get("wallet_1").address;
        let block = chain.mineBlock([
            Tx.contractCall('clearfund', 'launch', [
                types.utf8('Test Campaign'),
                types.buff('This is a campaign that I made.'),
                types.utf8('https://example.com'),
                types.uint(10000),
                types.uint(0),
                types.uint(100)
            ], wallet_1)
        ]);
        const result = block.receipts[0].result;
        result.expectErr().expectUint(103);
    }
});
// a user should not be able to launch a campaign ending sooner than current block
Clarinet.test({
    name: "a user should not be able to launch a campaign ending sooner than current block",
    async fn (chain, accounts) {
        const wallet_1 = accounts.get("wallet_1").address;
        let block = chain.mineBlock([
            Tx.contractCall('clearfund', 'launch', [
                types.utf8('Test Campaign'),
                types.buff('This is a campaign that I made.'),
                types.utf8('https://example.com'),
                types.uint(10000),
                types.uint(5),
                types.uint(0)
            ], wallet_1)
        ]);
        const result = block.receipts[0].result;
        result.expectErr().expectUint(104);
    }
});
// a user should not be able to launch a campaign ending more than 12960 blocks in the future
Clarinet.test({
    name: "a user should not be able to launch a campaign ending more than 12960 blocks in the future",
    async fn (chain, accounts) {
        const wallet_1 = accounts.get("wallet_1").address;
        let block = chain.mineBlock([
            Tx.contractCall('clearfund', 'launch', [
                types.utf8('Test Campaign'),
                types.buff('This is a campaign that I made.'),
                types.utf8('https://example.com'),
                types.uint(10000),
                types.uint(5),
                types.uint(20000)
            ], wallet_1)
        ]);
        const result = block.receipts[0].result;
        result.expectErr().expectUint(104);
    }
});
// CANCELING A CAMPAIGN
// a campign owner should be able to cancel a campaign before it starts
Clarinet.test({
    name: "a campign owner should be able to cancel a campaign before it starts",
    async fn (chain, accounts) {
        const wallet_1 = accounts.get("wallet_1").address;
        let block = chain.mineBlock([
            Tx.contractCall('clearfund', 'launch', [
                types.utf8('Test Campaign'),
                types.buff('This is a campaign that I made.'),
                types.utf8('https://example.com'),
                types.uint(10000),
                types.uint(5),
                types.uint(100)
            ], wallet_1)
        ]);
        let block2 = chain.mineBlock([
            Tx.contractCall('clearfund', 'cancel', [
                types.uint(1)
            ], wallet_1)
        ]);
        const cancelledCampaign = block2.receipts[0].result;
        cancelledCampaign.expectOk();
        const newCampaign = chain.callReadOnlyFn('clearfund', 'get-campaign', [
            types.uint(1)
        ], wallet_1);
        assertEquals(newCampaign.result, '(err u105)');
    }
});
// a campaign owner should not be able to cancel a campaign after it starts
Clarinet.test({
    name: "a campaign owner should not be able to cancel a campaign after it starts",
    async fn (chain, accounts) {
        const wallet_1 = accounts.get("wallet_1").address;
        let block = chain.mineBlock([
            Tx.contractCall('clearfund', 'launch', [
                types.utf8('Test Campaign'),
                types.buff('This is a campaign that I made.'),
                types.utf8('https://example.com'),
                types.uint(10000),
                types.uint(2),
                types.uint(100)
            ], wallet_1)
        ]);
        chain.mineEmptyBlockUntil(5);
        let block2 = chain.mineBlock([
            Tx.contractCall('clearfund', 'cancel', [
                types.uint(1)
            ], wallet_1)
        ]);
        const cancelledCampaign = block2.receipts[0].result;
        cancelledCampaign.expectErr();
    }
});
// a user who does not own a campaign should not be able to cancel it
Clarinet.test({
    name: "a user who does not own a campaign should not be able to cancel it",
    async fn (chain, accounts) {
        const wallet_1 = accounts.get("wallet_1").address;
        const wallet_2 = accounts.get("wallet_2").address;
        let block = chain.mineBlock([
            Tx.contractCall('clearfund', 'launch', [
                types.utf8('Test Campaign'),
                types.buff('This is a campaign that I made.'),
                types.utf8('https://example.com'),
                types.uint(10000),
                types.uint(5),
                types.uint(100)
            ], wallet_1)
        ]);
        let block2 = chain.mineBlock([
            Tx.contractCall('clearfund', 'cancel', [
                types.uint(1)
            ], wallet_2)
        ]);
        const cancelledCampaign = block2.receipts[0].result;
        cancelledCampaign.expectErr();
    }
});
// UPDATING A CAMPAIGN
// a campaign owner should be able to update the title, description, and link of a campaign
Clarinet.test({
    name: "a campaign owner should be able to update the title, description, and link of a campaign",
    async fn (chain, accounts) {
        const wallet_1 = accounts.get("wallet_1").address;
        let block = chain.mineBlock([
            Tx.contractCall('clearfund', 'launch', [
                types.utf8('Test Campaign'),
                types.buff('This is a campaign that I made.'),
                types.utf8('https://example.com'),
                types.uint(10000),
                types.uint(2),
                types.uint(100)
            ], wallet_1)
        ]);
        chain.mineEmptyBlockUntil(5);
        let block2 = chain.mineBlock([
            Tx.contractCall('clearfund', 'update', [
                types.uint(1),
                types.utf8("New Title"),
                types.buff("New description"),
                types.utf8("https://newexample.org")
            ], wallet_1)
        ]);
        const updatedCampaign = chain.callReadOnlyFn('clearfund', 'get-campaign', [
            types.uint(1)
        ], wallet_1);
        const expectedCampaign = updatedCampaign.result;
        console.log(expectedCampaign);
        expectedCampaign.expectOk();
        assertEquals(expectedCampaign, '(ok {campaignOwner: ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5, claimed: false, description: 0x4e6577206465736372697074696f6e, endsAt: u100, fundGoal: u10000, link: u"https://newexample.org", pledgedAmount: u0, pledgedCount: u0, startsAt: u2, targetReached: false, targetReachedBy: u0, title: u"New Title"})');
    }
});
// a user who does not own a campaign should not be able to update any information
Clarinet.test({
    name: "a user who does not own a campaign should not be able to update any information",
    async fn (chain, accounts) {
        const wallet_1 = accounts.get("wallet_1").address;
        const wallet_2 = accounts.get("wallet_2").address;
        let block = chain.mineBlock([
            Tx.contractCall('clearfund', 'launch', [
                types.utf8('Test Campaign'),
                types.buff('This is a campaign that I made.'),
                types.utf8('https://example.com'),
                types.uint(10000),
                types.uint(2),
                types.uint(100)
            ], wallet_1)
        ]);
        chain.mineEmptyBlockUntil(5);
        let block2 = chain.mineBlock([
            Tx.contractCall('clearfund', 'update', [
                types.uint(1),
                types.utf8("New Title"),
                types.buff("New description"),
                types.utf8("https://newexample.org")
            ], wallet_2)
        ]);
        const expectedCampaign = block2.receipts[0].result;
        expectedCampaign.expectErr();
    }
});
// a campaign owner should not be able to update a campaign after it has ended
Clarinet.test({
    name: "a campaign owner should not be able to update a campaign after it has ended",
    async fn (chain, accounts) {
        const wallet_1 = accounts.get("wallet_1").address;
        let block = chain.mineBlock([
            Tx.contractCall('clearfund', 'launch', [
                types.utf8('Test Campaign'),
                types.buff('This is a campaign that I made.'),
                types.utf8('https://example.com'),
                types.uint(10000),
                types.uint(2),
                types.uint(100)
            ], wallet_1)
        ]);
        chain.mineEmptyBlockUntil(200);
        let block2 = chain.mineBlock([
            Tx.contractCall('clearfund', 'update', [
                types.uint(1),
                types.utf8("New Title"),
                types.buff("New description"),
                types.utf8("https://newexample.org")
            ], wallet_1)
        ]);
        const expectedCampaign = block2.receipts[0].result;
        expectedCampaign.expectErr();
    }
});
// CLAIMING CAMPAIGN FUNDS
// a campaign owner should be able to collect funds after the funding goal has been reached
Clarinet.test({
    name: "a campaign owner should be able to collect funds after the funding goal has been reached",
    async fn (chain, accounts) {
        const wallet_1 = accounts.get("wallet_1").address;
        const wallet_2 = accounts.get("wallet_2").address;
        let block = chain.mineBlock([
            Tx.contractCall('clearfund', 'launch', [
                types.utf8('Test Campaign'),
                types.buff('This is a campaign that I made.'),
                types.utf8('https://example.com'),
                types.uint(10000),
                types.uint(2),
                types.uint(100)
            ], wallet_1)
        ]);
        chain.mineEmptyBlockUntil(5);
        let block2 = chain.mineBlock([
            Tx.contractCall('clearfund', 'pledge', [
                types.uint(1),
                types.uint(20000)
            ], wallet_2)
        ]);
        let block3 = chain.mineBlock([
            Tx.contractCall('clearfund', 'claim', [
                types.uint(1)
            ], wallet_1)
        ]);
        const claimedCampaignBlock = block3.receipts[0].result;
        claimedCampaignBlock.expectOk();
        const claimedCampaign = chain.callReadOnlyFn('clearfund', 'get-campaign', [
            types.uint(1)
        ], wallet_1);
        const expectedCampaign = claimedCampaign.result;
        expectedCampaign.expectOk();
        assertEquals(expectedCampaign, '(ok {campaignOwner: ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5, claimed: true, description: 0x5468697320697320612063616d706169676e20746861742049206d6164652e, endsAt: u100, fundGoal: u10000, link: u"https://example.com", pledgedAmount: u20000, pledgedCount: u1, startsAt: u2, targetReached: true, targetReachedBy: u6, title: u"Test Campaign"})');
    }
});
// a campaign owner should not be able to collect funds before funding goal has been reached
Clarinet.test({
    name: "a campaign owner should not be able to collect funds before funding goal has been reached",
    async fn (chain, accounts) {
        const wallet_1 = accounts.get("wallet_1").address;
        let block = chain.mineBlock([
            Tx.contractCall('clearfund', 'launch', [
                types.utf8('Test Campaign'),
                types.buff('This is a campaign that I made.'),
                types.utf8('https://example.com'),
                types.uint(10000),
                types.uint(2),
                types.uint(100)
            ], wallet_1)
        ]);
        chain.mineEmptyBlockUntil(5);
        let block2 = chain.mineBlock([
            Tx.contractCall('clearfund', 'claim', [
                types.uint(1)
            ], wallet_1)
        ]);
        const claimedCampaignBlock = block2.receipts[0].result;
        claimedCampaignBlock.expectErr();
        const claimedCampaign = chain.callReadOnlyFn('clearfund', 'get-campaign', [
            types.uint(1)
        ], wallet_1);
        const expectedCampaign = claimedCampaign.result;
        expectedCampaign.expectOk();
        assertEquals(expectedCampaign, '(ok {campaignOwner: ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5, claimed: false, description: 0x5468697320697320612063616d706169676e20746861742049206d6164652e, endsAt: u100, fundGoal: u10000, link: u"https://example.com", pledgedAmount: u0, pledgedCount: u0, startsAt: u2, targetReached: false, targetReachedBy: u0, title: u"Test Campaign"})');
    }
});
// a campaign owner should not be able to claim funds twice
Clarinet.test({
    name: "a campaign owner should not be able to claim funds twice",
    async fn (chain, accounts) {
        const wallet_1 = accounts.get("wallet_1").address;
        const wallet_2 = accounts.get("wallet_2").address;
        let block = chain.mineBlock([
            Tx.contractCall('clearfund', 'launch', [
                types.utf8('Test Campaign'),
                types.buff('This is a campaign that I made.'),
                types.utf8('https://example.com'),
                types.uint(10000),
                types.uint(2),
                types.uint(100)
            ], wallet_1)
        ]);
        chain.mineEmptyBlockUntil(5);
        let block2 = chain.mineBlock([
            Tx.contractCall('clearfund', 'pledge', [
                types.uint(1),
                types.uint(20000)
            ], wallet_2)
        ]);
        let block3 = chain.mineBlock([
            Tx.contractCall('clearfund', 'claim', [
                types.uint(1)
            ], wallet_1)
        ]);
        const claimedCampaignBlock = block3.receipts[0].result;
        claimedCampaignBlock.expectOk();
        const claimedCampaign = chain.callReadOnlyFn('clearfund', 'get-campaign', [
            types.uint(1)
        ], wallet_1);
        const expectedCampaign = claimedCampaign.result;
        expectedCampaign.expectOk();
        assertEquals(expectedCampaign, '(ok {campaignOwner: ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5, claimed: true, description: 0x5468697320697320612063616d706169676e20746861742049206d6164652e, endsAt: u100, fundGoal: u10000, link: u"https://example.com", pledgedAmount: u20000, pledgedCount: u1, startsAt: u2, targetReached: true, targetReachedBy: u6, title: u"Test Campaign"})');
        let block4 = chain.mineBlock([
            Tx.contractCall('clearfund', 'claim', [
                types.uint(1)
            ], wallet_1)
        ]);
        const failedClaim = block4.receipts[0].result;
        failedClaim.expectErr();
        assertEquals(failedClaim, '(err u116)');
    }
});
// a user who does not own a campaign should not be able to claim funds
Clarinet.test({
    name: "a user who does not own a campaign should not be able to claim funds",
    async fn (chain, accounts) {
        const wallet_1 = accounts.get("wallet_1").address;
        const wallet_2 = accounts.get("wallet_2").address;
        let block = chain.mineBlock([
            Tx.contractCall('clearfund', 'launch', [
                types.utf8('Test Campaign'),
                types.buff('This is a campaign that I made.'),
                types.utf8('https://example.com'),
                types.uint(10000),
                types.uint(2),
                types.uint(100)
            ], wallet_1)
        ]);
        chain.mineEmptyBlockUntil(5);
        let block2 = chain.mineBlock([
            Tx.contractCall('clearfund', 'pledge', [
                types.uint(1),
                types.uint(20000)
            ], wallet_2)
        ]);
        let block3 = chain.mineBlock([
            Tx.contractCall('clearfund', 'claim', [
                types.uint(1)
            ], wallet_2)
        ]);
        const claimedCampaign = block3.receipts[0].result;
        claimedCampaign.expectErr();
        assertEquals(claimedCampaign, '(err u107)');
    }
});
// PLEDGING TO A CAMPAIGN
Clarinet.test({
    name: "pledge: a user should be able to invest in a campaign that is active",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const wallet2 = accounts.get("wallet_2").address;
        chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(40);
        const block = chain.mineBlock([
            pledge(wallet2)
        ]);
        block.receipts[0].result.expectOk().expectBool(true);
    }
});
Clarinet.test({
    name: "pledge: the pledged amount should transfer to clearfund contract on successful pledge",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const wallet2 = accounts.get("wallet_2").address;
        chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(40);
        chain.mineBlock([
            pledge(wallet2)
        ]);
        const assetsMaps = chain.getAssetsMaps();
        const stxFundsTransferredToClearfund = assetsMaps.assets["STX"][`${deployer}.clearfund`];
        assertEquals(stxFundsTransferredToClearfund, 1000);
    }
});
Clarinet.test({
    name: "pledge: the count of investors should increment when a new investor pledges",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const wallet2 = accounts.get("wallet_2").address;
        const wallet3 = accounts.get("wallet_3").address;
        const wallet4 = accounts.get("wallet_4").address;
        chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(40);
        chain.mineBlock([
            pledge(wallet2),
            pledge(wallet3),
            pledge(wallet4)
        ]);
        const campaign = getCampaign(chain, deployer);
        campaign.result.expectOk().expectTuple();
        assertStringIncludes(campaign.result, "pledgedCount: u3");
    }
});
Clarinet.test({
    name: "pledge: the count of investors should stay the same when an investor pledges again",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const wallet2 = accounts.get("wallet_2").address;
        const wallet3 = accounts.get("wallet_3").address;
        chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(40);
        chain.mineBlock([
            pledge(wallet2),
            pledge(wallet3),
            pledge(wallet2),
            pledge(wallet3)
        ]);
        const campaign = getCampaign(chain, deployer);
        campaign.result.expectOk().expectTuple();
        assertStringIncludes(campaign.result, "pledgedCount: u2");
    }
});
Clarinet.test({
    name: "pledge: the pledged amount should increase when an investor pledges",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const wallet2 = accounts.get("wallet_2").address;
        const wallet3 = accounts.get("wallet_3").address;
        chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(40);
        chain.mineBlock([
            pledge(wallet2),
            pledge(wallet3),
            pledge(wallet2),
            pledge(wallet3)
        ]);
        const campaign = getCampaign(chain, deployer);
        campaign.result.expectOk().expectTuple();
        assertStringIncludes(campaign.result, "pledgedAmount: u4000");
    }
});
Clarinet.test({
    name: "pledge: the pledged mount should should reflect the correct investments by user in investment map ",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const wallet2 = accounts.get("wallet_2").address;
        const wallet3 = accounts.get("wallet_3").address;
        chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(40);
        chain.mineBlock([
            pledge(wallet2),
            pledge(wallet3),
            pledge(wallet2),
            pledge(wallet3),
            pledge(wallet3)
        ]);
        const investmentWallet2 = getInvestment(chain, wallet2);
        investmentWallet2.result.expectOk().expectSome();
        assertStringIncludes(investmentWallet2.result, "amount: u2000");
        const investmentWallet3 = getInvestment(chain, wallet3);
        investmentWallet3.result.expectOk().expectSome();
        assertStringIncludes(investmentWallet3.result, "amount: u3000");
    }
});
Clarinet.test({
    name: "pledge: a user should not be able to invest in a campaign that was never launched",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const block = chain.mineBlock([
            pledge(wallet1)
        ]);
        block.receipts[0].result.expectErr().expectUint(105);
    }
});
Clarinet.test({
    name: "pledge: a user should not be able to invest in a campaign that has not started",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        chain.mineBlock([
            launch(wallet1)
        ]);
        const block = chain.mineBlock([
            pledge(wallet1)
        ]);
        block.receipts[0].result.expectErr().expectUint(108);
    }
});
Clarinet.test({
    name: "pledge: a user should not be able to invest in a campaign that has ended",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(60);
        const block = chain.mineBlock([
            pledge(wallet1)
        ]);
        block.receipts[0].result.expectErr().expectUint(109);
    }
});
Clarinet.test({
    name: "pledge: a user should not be able to pledge 0 STX",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(40);
        const block = chain.mineBlock([
            pledgeAmountEmpty(wallet1)
        ]);
        block.receipts[0].result.expectErr().expectUint(110);
    }
});
Clarinet.test({
    name: "pledge: a user should not be sent an NFT when pledging less than 500 STX",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const wallet2 = accounts.get("wallet_2").address;
        chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(40);
        chain.mineBlock([
            pledgeAmountLessThan500(wallet2)
        ]);
        const assetsMaps = chain.getAssetsMaps();
        const nftReceived = assetsMaps.assets[".donorpass.donorpass"];
        assertEquals(nftReceived, undefined);
    }
});
Clarinet.test({
    name: "pledge: a user should be sent an NFT when pledging more than 500 STX",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const wallet2 = accounts.get("wallet_2").address;
        chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(40);
        chain.mineBlock([
            pledge(wallet2)
        ]);
        const assetsMaps = chain.getAssetsMaps();
        const nftReceivedByInvestor = assetsMaps.assets[".donorpass.donorpass"][wallet2];
        assertEquals(nftReceivedByInvestor, 1);
    }
});
// UNPLEDGING FROM A CAMPAIGN
Clarinet.test({
    name: "unpledge: a user should be able to unpledge their investment",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const wallet2 = accounts.get("wallet_2").address;
        chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(40);
        const block = chain.mineBlock([
            pledge(wallet2),
            unpledge(wallet2)
        ]);
        block.receipts[1].result.expectOk().expectBool(true);
    }
});
Clarinet.test({
    name: "unpledge: the unpledge amount is deducted from clearfund contract on successful unpledge",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const wallet2 = accounts.get("wallet_2").address;
        chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(40);
        chain.mineBlock([
            pledge(wallet2),
            unpledge(wallet2)
        ]);
        const assetsMaps = chain.getAssetsMaps();
        const stxFundsTransferredToClearfund = assetsMaps.assets["STX"][`${deployer}.clearfund`];
        assertEquals(stxFundsTransferredToClearfund, 500);
    }
});
Clarinet.test({
    name: "unpledge: the amount pledged should decrement by the same amount a user unpledged",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const wallet2 = accounts.get("wallet_2").address;
        chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(40);
        const block = chain.mineBlock([
            pledge(wallet2),
            unpledge(wallet2)
        ]);
        const assetsMaps = chain.getAssetsMaps();
        const stxAmountAfterUnpledge = assetsMaps.assets["STX"][`${deployer}.clearfund`];
        assertEquals(stxAmountAfterUnpledge, 500);
        const campaign = getCampaign(chain, deployer);
        campaign.result.expectOk().expectTuple();
        assertStringIncludes(campaign.result, "pledgedAmount: u500");
    }
});
Clarinet.test({
    name: "unpledge: the pledgedCount should decrement if a user unpledges their entire investment amount",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const wallet2 = accounts.get("wallet_2").address;
        chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(40);
        const block = chain.mineBlock([
            pledge(wallet2),
            unpledgeAll(wallet2)
        ]);
        block.receipts[1].result.expectOk();
        const campaign = getCampaign(chain, deployer);
        campaign.result.expectOk().expectTuple();
        assertStringIncludes(campaign.result, "pledgedCount: u0");
    }
});
Clarinet.test({
    name: "unpledge: the pledgedCount should not decrement if a user unpledges some of their investment amount",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const wallet2 = accounts.get("wallet_2").address;
        chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(40);
        const block = chain.mineBlock([
            pledge(wallet2),
            unpledge(wallet2)
        ]);
        block.receipts[1].result.expectOk();
        const campaign = getCampaign(chain, deployer);
        campaign.result.expectOk().expectTuple();
        assertStringIncludes(campaign.result, "pledgedCount: u1");
    }
});
Clarinet.test({
    name: "unpledge: a user should not be able to unpledge if the campaign has ended",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const wallet2 = accounts.get("wallet_2").address;
        chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(60);
        const block = chain.mineBlock([
            pledge(wallet2),
            unpledge(wallet2)
        ]);
        block.receipts[0].result.expectErr().expectUint(109);
    }
});
Clarinet.test({
    name: "unpledge: a user should not be able to unpledge more than they have pledged",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const wallet2 = accounts.get("wallet_2").address;
        chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(40);
        const block = chain.mineBlock([
            pledge(wallet2),
            unpledgeMoreThanPledged(wallet2)
        ]);
        block.receipts[1].result.expectErr().expectUint(113);
        assertEquals(block.receipts[1].events.length, 0);
    }
});
Clarinet.test({
    name: "unpledge: a user should not be able to unpledge someone else's investment",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const wallet2 = accounts.get("wallet_2").address;
        const wallet3 = accounts.get("wallet_3").address;
        chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(40);
        chain.mineBlock([
            pledge(wallet2)
        ]);
        const assetsMaps = chain.getAssetsMaps();
        const stxFundsTransferredToClearfund = assetsMaps.assets["STX"][`${deployer}.clearfund`];
        assertEquals(stxFundsTransferredToClearfund, 1000);
        const block = chain.mineBlock([
            unpledge(wallet3)
        ]);
        const assetsMaps2 = chain.getAssetsMaps();
        const stxFundsTransferredToClearfund2 = assetsMaps2.assets["STX"][`${deployer}.clearfund`];
        assertEquals(stxFundsTransferredToClearfund2, 1000);
        block.receipts[0].result.expectErr().expectUint(112);
    }
});
// REFUND FROM A CAMPAIGN
Clarinet.test({
    name: "refund: a user can get refund from the campaign that has ended and not reached its goal",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const wallet2 = accounts.get("wallet_2").address;
        chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(20);
        chain.mineBlock([
            pledge(wallet2)
        ]);
        chain.mineEmptyBlockUntil(60);
        const block = chain.mineBlock([
            refund(wallet2)
        ]);
        block.receipts[0].result.expectOk().expectBool(true);
    }
});
Clarinet.test({
    name: "refund: the total amount pledged is refunded to the investor from the campaign on successful refund",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const wallet2 = accounts.get("wallet_2").address;
        chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(20);
        chain.mineBlock([
            pledge(wallet2)
        ]);
        chain.mineEmptyBlockUntil(60);
        const assetsMaps = chain.getAssetsMaps();
        const stxFundsClearfundAfterPledge = assetsMaps.assets["STX"][`${deployer}.clearfund`];
        const stxFundsWallet2AfterPledge = assetsMaps.assets["STX"][wallet2];
        chain.mineBlock([
            refund(wallet2)
        ]);
        const assetsMaps2 = chain.getAssetsMaps();
        const stxFundsWallet2AfterRefund = assetsMaps2.assets["STX"][wallet2];
        assertEquals(stxFundsWallet2AfterRefund, stxFundsWallet2AfterPledge + stxFundsClearfundAfterPledge);
    }
});
Clarinet.test({
    name: "refund: the investment record is deleted from the investment map on successful refund to the user",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const wallet2 = accounts.get("wallet_2").address;
        chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(20);
        chain.mineBlock([
            pledge(wallet2)
        ]);
        chain.mineEmptyBlockUntil(60);
        chain.mineBlock([
            refund(wallet2)
        ]);
        const investment = getInvestment(chain, deployer);
        investment.result.expectOk().expectNone();
    }
});
Clarinet.test({
    name: "refund: a user cannot get refund from a campaign that does not exist",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const wallet2 = accounts.get("wallet_2").address;
        const block = chain.mineBlock([
            refund(wallet2)
        ]);
        block.receipts[0].result.expectErr().expectUint(105);
    }
});
Clarinet.test({
    name: "refund: a user cannot get refund from a campaign where the user did not make any pledges",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const wallet2 = accounts.get("wallet_2").address;
        chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(40);
        const block = chain.mineBlock([
            refund(wallet2)
        ]);
        block.receipts[0].result.expectErr().expectUint(112);
    }
});
Clarinet.test({
    name: "refund: a user cannot get refund from a campaign that is still active",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const wallet2 = accounts.get("wallet_2").address;
        chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(40);
        chain.mineBlock([
            pledge(wallet2)
        ]);
        const block = chain.mineBlock([
            refund(wallet2)
        ]);
        block.receipts[0].result.expectErr().expectUint(114);
    }
});
Clarinet.test({
    name: "refund: a user cannot get refund from a campaign that has ended and has reached the goal",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const wallet2 = accounts.get("wallet_2").address;
        chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(20);
        chain.mineBlock([
            pledge(wallet2),
            pledgeAmountGreaterThanGoal(wallet2)
        ]);
        chain.mineEmptyBlockUntil(60);
        const block = chain.mineBlock([
            refund(wallet2)
        ]);
        block.receipts[0].result.expectErr().expectUint(115);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvYW5kcmVzY2MvRG9jdW1lbnRzL0Jsb2NrY2hhaW4vY2xhcml0eS1jb2RlLWNoYWxsZW5nZS90ZXN0cy9jbGVhcmZ1bmRfdGVzdC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJcbmltcG9ydCB7IENsYXJpbmV0LCBUeCwgQ2hhaW4sIEFjY291bnQsIHR5cGVzIH0gZnJvbSAnaHR0cHM6Ly9kZW5vLmxhbmQveC9jbGFyaW5ldEB2MS4wLjYvaW5kZXgudHMnO1xuaW1wb3J0IHsgYXNzZXJ0RXF1YWxzLCBhc3NlcnRTdHJpbmdJbmNsdWRlcyB9IGZyb20gJ2h0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjkwLjAvdGVzdGluZy9hc3NlcnRzLnRzJztcbmltcG9ydCB7XG4gICAgbGF1bmNoLFxuICAgIHBsZWRnZSxcbiAgICBwbGVkZ2VBbW91bnRFbXB0eSxcbiAgICBwbGVkZ2VBbW91bnRMZXNzVGhhbjUwMCxcbiAgICBnZXRDYW1wYWlnbixcbiAgICB1bnBsZWRnZSxcbiAgICB1bnBsZWRnZU1vcmVUaGFuUGxlZGdlZCxcbiAgICB1bnBsZWRnZUFsbCxcbiAgICBnZXRJbnZlc3RtZW50LFxuICAgIHJlZnVuZCxcbiAgICBwbGVkZ2VBbW91bnRHcmVhdGVyVGhhbkdvYWxcbn0gZnJvbSAnLi4vaGVscGVycy9jbGVhcmZ1bmQudHMnXG5cbmZ1bmN0aW9uIHNldHVwKCkge1xuICAgIGRlc2NyaXB0aW9uOiBcIkNyb3dkZnVuZGluZyBpcyBhIHdheSB0byByYWlzZSBtb25leSBmb3IgYW4gaW5kaXZpZHVhbCBvciBvcmdhbml6YXRpb24gYnkgY29sbGVjdGluZyBkb25hdGlvbnMgdGhyb3VnaCBmYW1pbHksIGZyaWVuZHMsIGZyaWVuZHMgb2YgZnJpZW5kcywgc3RyYW5nZXJzLCBidXNpbmVzc2VzLCBhbmQgbW9yZS5cIlxufVxuXG4vLyBURVNUIENBU0VTXG5cbi8vIExBVU5DSElORyBBIENBTVBBSUdOXG4vLyBhIHVzZXIgc2hvdWxkIGJlIGFibGUgdG8gbGF1bmNoIGEgbmV3IGNhbXBhaWduXG5DbGFyaW5ldC50ZXN0KHtcbiAgICBuYW1lOiBcIkEgdXNlciBzaG91bGQgYmUgYWJsZSB0byBsYXVuY2ggYSBuZXcgY2FtcGFpZ25cIixcbiAgICBhc3luYyBmbihjaGFpbjogQ2hhaW4sIGFjY291bnRzOiBNYXA8c3RyaW5nLCBBY2NvdW50Pikge1xuXG4gICAgICAgIGNvbnN0IHdhbGxldF8xID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzFcIikhLmFkZHJlc3NcblxuICAgICAgICBsZXQgYmxvY2sgPSBjaGFpbi5taW5lQmxvY2soW1xuICAgICAgICAgICAgVHguY29udHJhY3RDYWxsKCdjbGVhcmZ1bmQnLCAnbGF1bmNoJywgW3R5cGVzLnV0ZjgoJ1Rlc3QgQ2FtcGFpZ24nKSwgdHlwZXMuYnVmZignVGhpcyBpcyBhIGNhbXBhaWduIHRoYXQgSSBtYWRlLicpLCB0eXBlcy51dGY4KCdodHRwczovL2V4YW1wbGUuY29tJyksIHR5cGVzLnVpbnQoMTAwMDApLCB0eXBlcy51aW50KDIpLCB0eXBlcy51aW50KDEwMCldLCB3YWxsZXRfMSlcbiAgICAgICAgXSk7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGJsb2NrLnJlY2VpcHRzWzBdLnJlc3VsdDtcbiAgICAgICAgcmVzdWx0LmV4cGVjdE9rKCkuZXhwZWN0VWludCgxKTtcbiAgICB9LFxufSk7XG5cbi8vIGEgdXNlciBzaG91bGQgYmUgYWJsZSB0byB2aWV3IGNhbXBhaWduIGluZm9ybWF0aW9uXG5DbGFyaW5ldC50ZXN0KHtcbiAgICBuYW1lOiBcIkEgdXNlciBzaG91bGQgYmUgYWJsZSB0byB2aWV3IGNhbXBhaWduIGluZm9ybWF0aW9uXCIsXG4gICAgYXN5bmMgZm4oY2hhaW46IENoYWluLCBhY2NvdW50czogTWFwPHN0cmluZywgQWNjb3VudD4pIHtcblxuICAgICAgICBjb25zdCB3YWxsZXRfMSA9IGFjY291bnRzLmdldChcIndhbGxldF8xXCIpIS5hZGRyZXNzXG5cbiAgICAgICAgbGV0IGJsb2NrID0gY2hhaW4ubWluZUJsb2NrKFtcbiAgICAgICAgICAgIFR4LmNvbnRyYWN0Q2FsbCgnY2xlYXJmdW5kJywgJ2xhdW5jaCcsIFt0eXBlcy51dGY4KCdUZXN0IENhbXBhaWduJyksIHR5cGVzLmJ1ZmYoJ1RoaXMgaXMgYSBjYW1wYWlnbiB0aGF0IEkgbWFkZS4nKSwgdHlwZXMudXRmOCgnaHR0cHM6Ly9leGFtcGxlLmNvbScpLCB0eXBlcy51aW50KDEwMDAwKSwgdHlwZXMudWludCgyKSwgdHlwZXMudWludCgxMDApXSwgd2FsbGV0XzEpXG4gICAgICAgIF0pO1xuXG4gICAgICAgIGNvbnN0IG5ld0NhbXBhaWduID0gY2hhaW4uY2FsbFJlYWRPbmx5Rm4oXG4gICAgICAgICAgICAnY2xlYXJmdW5kJyxcbiAgICAgICAgICAgICdnZXQtY2FtcGFpZ24nLFxuICAgICAgICAgICAgW3R5cGVzLnVpbnQoMSldLFxuICAgICAgICAgICAgd2FsbGV0XzFcbiAgICAgICAgKTtcblxuICAgICAgICBjb25zdCBleHBlY3RlZENhbXBhaWduID0gbmV3Q2FtcGFpZ24ucmVzdWx0O1xuICAgICAgICBleHBlY3RlZENhbXBhaWduLmV4cGVjdE9rKCk7XG4gICAgICAgIGFzc2VydEVxdWFscyhleHBlY3RlZENhbXBhaWduLCAnKG9rIHtjYW1wYWlnbk93bmVyOiBTVDFTSjNEVEU1RE43WDU0WURINUQ2NFIzQkNCNkEyQUcyWlE4WVBENSwgY2xhaW1lZDogZmFsc2UsIGRlc2NyaXB0aW9uOiAweDU0Njg2OTczMjA2OTczMjA2MTIwNjM2MTZkNzA2MTY5Njc2ZTIwNzQ2ODYxNzQyMDQ5MjA2ZDYxNjQ2NTJlLCBlbmRzQXQ6IHUxMDAsIGZ1bmRHb2FsOiB1MTAwMDAsIGxpbms6IHVcImh0dHBzOi8vZXhhbXBsZS5jb21cIiwgcGxlZGdlZEFtb3VudDogdTAsIHBsZWRnZWRDb3VudDogdTAsIHN0YXJ0c0F0OiB1MiwgdGFyZ2V0UmVhY2hlZDogZmFsc2UsIHRhcmdldFJlYWNoZWRCeTogdTAsIHRpdGxlOiB1XCJUZXN0IENhbXBhaWduXCJ9KScpO1xuICAgIH0sXG59KTtcblxuLy8gYSB1c2VyIHNob3VsZCBub3QgYmUgYWJsZSB0byBsYXVuY2ggYSBjYW1wYWlnbiB3aXRoIGEgZnVuZEdvYWwgb2YgMFxuQ2xhcmluZXQudGVzdCh7XG4gICAgbmFtZTogXCJhIHVzZXIgc2hvdWxkIG5vdCBiZSBhYmxlIHRvIGxhdW5jaCBhIGNhbXBhaWduIHdpdGhvdXQgYSBmdW5kR29hbFwiLFxuICAgIGFzeW5jIGZuKGNoYWluOiBDaGFpbiwgYWNjb3VudHM6IE1hcDxzdHJpbmcsIEFjY291bnQ+KSB7XG5cbiAgICAgICAgY29uc3Qgd2FsbGV0XzEgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfMVwiKSEuYWRkcmVzc1xuXG4gICAgICAgIGxldCBibG9jayA9IGNoYWluLm1pbmVCbG9jayhbXG4gICAgICAgICAgICBUeC5jb250cmFjdENhbGwoJ2NsZWFyZnVuZCcsICdsYXVuY2gnLCBbdHlwZXMudXRmOCgnVGVzdCBDYW1wYWlnbicpLCB0eXBlcy5idWZmKCdUaGlzIGlzIGEgY2FtcGFpZ24gdGhhdCBJIG1hZGUuJyksIHR5cGVzLnV0ZjgoJ2h0dHBzOi8vZXhhbXBsZS5jb20nKSwgdHlwZXMudWludCgwKSwgdHlwZXMudWludCgyKSwgdHlwZXMudWludCgxMDApXSwgd2FsbGV0XzEpXG4gICAgICAgIF0pO1xuICAgICAgICBjb25zdCByZXN1bHQgPSBibG9jay5yZWNlaXB0c1swXS5yZXN1bHQ7XG4gICAgICAgIHJlc3VsdC5leHBlY3RFcnIoKS5leHBlY3RVaW50KDEwMik7XG4gICAgfSxcbn0pO1xuXG4vLyBhIHVzZXIgc2hvdWxkIG5vdCBiZSBhYmxlIHRvIGxhdW5jaCBhIGNhbXBhaWduIHdpdGhvdXQgYSB0aXRsZSwgZGVzY3JpcHRpb24sIG9yIGxpbmtcbkNsYXJpbmV0LnRlc3Qoe1xuICAgIG5hbWU6IFwiYSB1c2VyIHNob3VsZCBub3QgYmUgYWJsZSB0byBsYXVuY2ggYSBjYW1wYWlnbiB3aXRob3V0IGEgdGl0bGUsIGRlc2NyaXB0aW9uLCBvciBsaW5rXCIsXG4gICAgYXN5bmMgZm4oY2hhaW46IENoYWluLCBhY2NvdW50czogTWFwPHN0cmluZywgQWNjb3VudD4pIHtcblxuICAgICAgICBjb25zdCB3YWxsZXRfMSA9IGFjY291bnRzLmdldChcIndhbGxldF8xXCIpIS5hZGRyZXNzXG5cbiAgICAgICAgbGV0IGJsb2NrID0gY2hhaW4ubWluZUJsb2NrKFtcbiAgICAgICAgICAgIFR4LmNvbnRyYWN0Q2FsbCgnY2xlYXJmdW5kJywgJ2xhdW5jaCcsIFt0eXBlcy51dGY4KCcnKSwgdHlwZXMuYnVmZignVGhpcyBpcyBhIGNhbXBhaWduIHRoYXQgSSBtYWRlLicpLCB0eXBlcy51dGY4KCdodHRwczovL2V4YW1wbGUuY29tJyksIHR5cGVzLnVpbnQoMTAwMDApLCB0eXBlcy51aW50KDIpLCB0eXBlcy51aW50KDEwMCldLCB3YWxsZXRfMSlcbiAgICAgICAgXSk7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGJsb2NrLnJlY2VpcHRzWzBdLnJlc3VsdDtcbiAgICAgICAgcmVzdWx0LmV4cGVjdEVycigpLmV4cGVjdFVpbnQoMTAxKTtcblxuICAgICAgICBsZXQgYmxvY2syID0gY2hhaW4ubWluZUJsb2NrKFtcbiAgICAgICAgICAgIFR4LmNvbnRyYWN0Q2FsbCgnY2xlYXJmdW5kJywgJ2xhdW5jaCcsIFt0eXBlcy51dGY4KCdOYW1lJyksIHR5cGVzLmJ1ZmYoJycpLCB0eXBlcy51dGY4KCdodHRwczovL2V4YW1wbGUuY29tJyksIHR5cGVzLnVpbnQoMTAwMDApLCB0eXBlcy51aW50KDIpLCB0eXBlcy51aW50KDEwMCldLCB3YWxsZXRfMSlcbiAgICAgICAgXSk7XG4gICAgICAgIGNvbnN0IHJlc3VsdDIgPSBibG9jazIucmVjZWlwdHNbMF0ucmVzdWx0O1xuICAgICAgICByZXN1bHQuZXhwZWN0RXJyKCkuZXhwZWN0VWludCgxMDEpO1xuXG4gICAgICAgIGxldCBibG9jazMgPSBjaGFpbi5taW5lQmxvY2soW1xuICAgICAgICAgICAgVHguY29udHJhY3RDYWxsKCdjbGVhcmZ1bmQnLCAnbGF1bmNoJywgW3R5cGVzLnV0ZjgoJ05hbWUnKSwgdHlwZXMuYnVmZignVGhpcyBpcyBhIGNhbXBhaWduIHRoYXQgSSBtYWRlLicpLCB0eXBlcy51dGY4KCcnKSwgdHlwZXMudWludCgxMDAwMCksIHR5cGVzLnVpbnQoMiksIHR5cGVzLnVpbnQoMTAwKV0sIHdhbGxldF8xKVxuICAgICAgICBdKTtcbiAgICAgICAgY29uc3QgcmVzdWx0MyA9IGJsb2NrMy5yZWNlaXB0c1swXS5yZXN1bHQ7XG4gICAgICAgIHJlc3VsdC5leHBlY3RFcnIoKS5leHBlY3RVaW50KDEwMSk7XG4gICAgfSxcbn0pO1xuXG4vLyBhIHVzZXIgc2hvdWxkIG5vdCBiZSBhYmxlIHRvIGxhdW5jaCBhIGNhbXBhaWduIHN0YXJ0aW5nIHNvb25lciB0aGFuIGN1cnJlbnQgYmxvY2tcbkNsYXJpbmV0LnRlc3Qoe1xuICAgIG5hbWU6IFwiYSB1c2VyIHNob3VsZCBub3QgYmUgYWJsZSB0byBsYXVuY2ggYSBjYW1wYWlnbiBzdGFydGluZyBzb29uZXIgdGhhbiBjdXJyZW50IGJsb2NrXCIsXG4gICAgYXN5bmMgZm4oY2hhaW46IENoYWluLCBhY2NvdW50czogTWFwPHN0cmluZywgQWNjb3VudD4pIHtcblxuICAgICAgICBjb25zdCB3YWxsZXRfMSA9IGFjY291bnRzLmdldChcIndhbGxldF8xXCIpIS5hZGRyZXNzXG5cbiAgICAgICAgbGV0IGJsb2NrID0gY2hhaW4ubWluZUJsb2NrKFtcbiAgICAgICAgICAgIFR4LmNvbnRyYWN0Q2FsbCgnY2xlYXJmdW5kJywgJ2xhdW5jaCcsIFt0eXBlcy51dGY4KCdUZXN0IENhbXBhaWduJyksIHR5cGVzLmJ1ZmYoJ1RoaXMgaXMgYSBjYW1wYWlnbiB0aGF0IEkgbWFkZS4nKSwgdHlwZXMudXRmOCgnaHR0cHM6Ly9leGFtcGxlLmNvbScpLCB0eXBlcy51aW50KDEwMDAwKSwgdHlwZXMudWludCgwKSwgdHlwZXMudWludCgxMDApXSwgd2FsbGV0XzEpXG4gICAgICAgIF0pO1xuICAgICAgICBjb25zdCByZXN1bHQgPSBibG9jay5yZWNlaXB0c1swXS5yZXN1bHQ7XG4gICAgICAgIHJlc3VsdC5leHBlY3RFcnIoKS5leHBlY3RVaW50KDEwMyk7XG4gICAgfSxcbn0pO1xuXG4vLyBhIHVzZXIgc2hvdWxkIG5vdCBiZSBhYmxlIHRvIGxhdW5jaCBhIGNhbXBhaWduIGVuZGluZyBzb29uZXIgdGhhbiBjdXJyZW50IGJsb2NrXG5DbGFyaW5ldC50ZXN0KHtcbiAgICBuYW1lOiBcImEgdXNlciBzaG91bGQgbm90IGJlIGFibGUgdG8gbGF1bmNoIGEgY2FtcGFpZ24gZW5kaW5nIHNvb25lciB0aGFuIGN1cnJlbnQgYmxvY2tcIixcbiAgICBhc3luYyBmbihjaGFpbjogQ2hhaW4sIGFjY291bnRzOiBNYXA8c3RyaW5nLCBBY2NvdW50Pikge1xuXG4gICAgICAgIGNvbnN0IHdhbGxldF8xID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzFcIikhLmFkZHJlc3NcblxuICAgICAgICBsZXQgYmxvY2sgPSBjaGFpbi5taW5lQmxvY2soW1xuICAgICAgICAgICAgVHguY29udHJhY3RDYWxsKCdjbGVhcmZ1bmQnLCAnbGF1bmNoJywgW3R5cGVzLnV0ZjgoJ1Rlc3QgQ2FtcGFpZ24nKSwgdHlwZXMuYnVmZignVGhpcyBpcyBhIGNhbXBhaWduIHRoYXQgSSBtYWRlLicpLCB0eXBlcy51dGY4KCdodHRwczovL2V4YW1wbGUuY29tJyksIHR5cGVzLnVpbnQoMTAwMDApLCB0eXBlcy51aW50KDUpLCB0eXBlcy51aW50KDApXSwgd2FsbGV0XzEpXG4gICAgICAgIF0pO1xuICAgICAgICBjb25zdCByZXN1bHQgPSBibG9jay5yZWNlaXB0c1swXS5yZXN1bHQ7XG4gICAgICAgIHJlc3VsdC5leHBlY3RFcnIoKS5leHBlY3RVaW50KDEwNCk7XG4gICAgfSxcbn0pO1xuXG4vLyBhIHVzZXIgc2hvdWxkIG5vdCBiZSBhYmxlIHRvIGxhdW5jaCBhIGNhbXBhaWduIGVuZGluZyBtb3JlIHRoYW4gMTI5NjAgYmxvY2tzIGluIHRoZSBmdXR1cmVcbkNsYXJpbmV0LnRlc3Qoe1xuICAgIG5hbWU6IFwiYSB1c2VyIHNob3VsZCBub3QgYmUgYWJsZSB0byBsYXVuY2ggYSBjYW1wYWlnbiBlbmRpbmcgbW9yZSB0aGFuIDEyOTYwIGJsb2NrcyBpbiB0aGUgZnV0dXJlXCIsXG4gICAgYXN5bmMgZm4oY2hhaW46IENoYWluLCBhY2NvdW50czogTWFwPHN0cmluZywgQWNjb3VudD4pIHtcblxuICAgICAgICBjb25zdCB3YWxsZXRfMSA9IGFjY291bnRzLmdldChcIndhbGxldF8xXCIpIS5hZGRyZXNzXG5cbiAgICAgICAgbGV0IGJsb2NrID0gY2hhaW4ubWluZUJsb2NrKFtcbiAgICAgICAgICAgIFR4LmNvbnRyYWN0Q2FsbCgnY2xlYXJmdW5kJywgJ2xhdW5jaCcsIFt0eXBlcy51dGY4KCdUZXN0IENhbXBhaWduJyksIHR5cGVzLmJ1ZmYoJ1RoaXMgaXMgYSBjYW1wYWlnbiB0aGF0IEkgbWFkZS4nKSwgdHlwZXMudXRmOCgnaHR0cHM6Ly9leGFtcGxlLmNvbScpLCB0eXBlcy51aW50KDEwMDAwKSwgdHlwZXMudWludCg1KSwgdHlwZXMudWludCgyMDAwMCldLCB3YWxsZXRfMSlcbiAgICAgICAgXSk7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGJsb2NrLnJlY2VpcHRzWzBdLnJlc3VsdDtcbiAgICAgICAgcmVzdWx0LmV4cGVjdEVycigpLmV4cGVjdFVpbnQoMTA0KTtcbiAgICB9LFxufSk7XG5cbi8vIENBTkNFTElORyBBIENBTVBBSUdOXG4vLyBhIGNhbXBpZ24gb3duZXIgc2hvdWxkIGJlIGFibGUgdG8gY2FuY2VsIGEgY2FtcGFpZ24gYmVmb3JlIGl0IHN0YXJ0c1xuQ2xhcmluZXQudGVzdCh7XG4gICAgbmFtZTogXCJhIGNhbXBpZ24gb3duZXIgc2hvdWxkIGJlIGFibGUgdG8gY2FuY2VsIGEgY2FtcGFpZ24gYmVmb3JlIGl0IHN0YXJ0c1wiLFxuICAgIGFzeW5jIGZuKGNoYWluOiBDaGFpbiwgYWNjb3VudHM6IE1hcDxzdHJpbmcsIEFjY291bnQ+KSB7XG5cbiAgICAgICAgY29uc3Qgd2FsbGV0XzEgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfMVwiKSEuYWRkcmVzc1xuXG4gICAgICAgIGxldCBibG9jayA9IGNoYWluLm1pbmVCbG9jayhbXG4gICAgICAgICAgICBUeC5jb250cmFjdENhbGwoJ2NsZWFyZnVuZCcsICdsYXVuY2gnLCBbdHlwZXMudXRmOCgnVGVzdCBDYW1wYWlnbicpLCB0eXBlcy5idWZmKCdUaGlzIGlzIGEgY2FtcGFpZ24gdGhhdCBJIG1hZGUuJyksIHR5cGVzLnV0ZjgoJ2h0dHBzOi8vZXhhbXBsZS5jb20nKSwgdHlwZXMudWludCgxMDAwMCksIHR5cGVzLnVpbnQoNSksIHR5cGVzLnVpbnQoMTAwKV0sIHdhbGxldF8xKVxuICAgICAgICBdKTtcblxuICAgICAgICBsZXQgYmxvY2syID0gY2hhaW4ubWluZUJsb2NrKFtcbiAgICAgICAgICAgIFR4LmNvbnRyYWN0Q2FsbCgnY2xlYXJmdW5kJywgJ2NhbmNlbCcsIFt0eXBlcy51aW50KDEpXSwgd2FsbGV0XzEpXG4gICAgICAgIF0pXG5cbiAgICAgICAgY29uc3QgY2FuY2VsbGVkQ2FtcGFpZ24gPSBibG9jazIucmVjZWlwdHNbMF0ucmVzdWx0O1xuICAgICAgICBjYW5jZWxsZWRDYW1wYWlnbi5leHBlY3RPaygpO1xuXG4gICAgICAgIGNvbnN0IG5ld0NhbXBhaWduID0gY2hhaW4uY2FsbFJlYWRPbmx5Rm4oXG4gICAgICAgICAgICAnY2xlYXJmdW5kJyxcbiAgICAgICAgICAgICdnZXQtY2FtcGFpZ24nLFxuICAgICAgICAgICAgW3R5cGVzLnVpbnQoMSldLFxuICAgICAgICAgICAgd2FsbGV0XzFcbiAgICAgICAgKTtcblxuICAgICAgICBhc3NlcnRFcXVhbHMobmV3Q2FtcGFpZ24ucmVzdWx0LCAnKGVyciB1MTA1KScpO1xuICAgIH0sXG59KTtcblxuLy8gYSBjYW1wYWlnbiBvd25lciBzaG91bGQgbm90IGJlIGFibGUgdG8gY2FuY2VsIGEgY2FtcGFpZ24gYWZ0ZXIgaXQgc3RhcnRzXG5DbGFyaW5ldC50ZXN0KHtcbiAgICBuYW1lOiBcImEgY2FtcGFpZ24gb3duZXIgc2hvdWxkIG5vdCBiZSBhYmxlIHRvIGNhbmNlbCBhIGNhbXBhaWduIGFmdGVyIGl0IHN0YXJ0c1wiLFxuICAgIGFzeW5jIGZuKGNoYWluOiBDaGFpbiwgYWNjb3VudHM6IE1hcDxzdHJpbmcsIEFjY291bnQ+KSB7XG5cbiAgICAgICAgY29uc3Qgd2FsbGV0XzEgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfMVwiKSEuYWRkcmVzc1xuXG4gICAgICAgIGxldCBibG9jayA9IGNoYWluLm1pbmVCbG9jayhbXG4gICAgICAgICAgICBUeC5jb250cmFjdENhbGwoJ2NsZWFyZnVuZCcsICdsYXVuY2gnLCBbdHlwZXMudXRmOCgnVGVzdCBDYW1wYWlnbicpLCB0eXBlcy5idWZmKCdUaGlzIGlzIGEgY2FtcGFpZ24gdGhhdCBJIG1hZGUuJyksIHR5cGVzLnV0ZjgoJ2h0dHBzOi8vZXhhbXBsZS5jb20nKSwgdHlwZXMudWludCgxMDAwMCksIHR5cGVzLnVpbnQoMiksIHR5cGVzLnVpbnQoMTAwKV0sIHdhbGxldF8xKVxuICAgICAgICBdKTtcblxuICAgICAgICBjaGFpbi5taW5lRW1wdHlCbG9ja1VudGlsKDUpXG5cbiAgICAgICAgbGV0IGJsb2NrMiA9IGNoYWluLm1pbmVCbG9jayhbXG4gICAgICAgICAgICBUeC5jb250cmFjdENhbGwoJ2NsZWFyZnVuZCcsICdjYW5jZWwnLCBbdHlwZXMudWludCgxKV0sIHdhbGxldF8xKVxuICAgICAgICBdKVxuXG4gICAgICAgIGNvbnN0IGNhbmNlbGxlZENhbXBhaWduID0gYmxvY2syLnJlY2VpcHRzWzBdLnJlc3VsdDtcbiAgICAgICAgY2FuY2VsbGVkQ2FtcGFpZ24uZXhwZWN0RXJyKCk7XG4gICAgfSxcbn0pO1xuXG4vLyBhIHVzZXIgd2hvIGRvZXMgbm90IG93biBhIGNhbXBhaWduIHNob3VsZCBub3QgYmUgYWJsZSB0byBjYW5jZWwgaXRcbkNsYXJpbmV0LnRlc3Qoe1xuICAgIG5hbWU6IFwiYSB1c2VyIHdobyBkb2VzIG5vdCBvd24gYSBjYW1wYWlnbiBzaG91bGQgbm90IGJlIGFibGUgdG8gY2FuY2VsIGl0XCIsXG4gICAgYXN5bmMgZm4oY2hhaW46IENoYWluLCBhY2NvdW50czogTWFwPHN0cmluZywgQWNjb3VudD4pIHtcblxuICAgICAgICBjb25zdCB3YWxsZXRfMSA9IGFjY291bnRzLmdldChcIndhbGxldF8xXCIpIS5hZGRyZXNzXG4gICAgICAgIGNvbnN0IHdhbGxldF8yID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzJcIikhLmFkZHJlc3NcblxuICAgICAgICBsZXQgYmxvY2sgPSBjaGFpbi5taW5lQmxvY2soW1xuICAgICAgICAgICAgVHguY29udHJhY3RDYWxsKCdjbGVhcmZ1bmQnLCAnbGF1bmNoJywgW3R5cGVzLnV0ZjgoJ1Rlc3QgQ2FtcGFpZ24nKSwgdHlwZXMuYnVmZignVGhpcyBpcyBhIGNhbXBhaWduIHRoYXQgSSBtYWRlLicpLCB0eXBlcy51dGY4KCdodHRwczovL2V4YW1wbGUuY29tJyksIHR5cGVzLnVpbnQoMTAwMDApLCB0eXBlcy51aW50KDUpLCB0eXBlcy51aW50KDEwMCldLCB3YWxsZXRfMSlcbiAgICAgICAgXSk7XG5cbiAgICAgICAgbGV0IGJsb2NrMiA9IGNoYWluLm1pbmVCbG9jayhbXG4gICAgICAgICAgICBUeC5jb250cmFjdENhbGwoJ2NsZWFyZnVuZCcsICdjYW5jZWwnLCBbdHlwZXMudWludCgxKV0sIHdhbGxldF8yKVxuICAgICAgICBdKVxuXG4gICAgICAgIGNvbnN0IGNhbmNlbGxlZENhbXBhaWduID0gYmxvY2syLnJlY2VpcHRzWzBdLnJlc3VsdDtcbiAgICAgICAgY2FuY2VsbGVkQ2FtcGFpZ24uZXhwZWN0RXJyKCk7XG4gICAgfSxcbn0pO1xuXG4vLyBVUERBVElORyBBIENBTVBBSUdOXG4vLyBhIGNhbXBhaWduIG93bmVyIHNob3VsZCBiZSBhYmxlIHRvIHVwZGF0ZSB0aGUgdGl0bGUsIGRlc2NyaXB0aW9uLCBhbmQgbGluayBvZiBhIGNhbXBhaWduXG5DbGFyaW5ldC50ZXN0KHtcbiAgICBuYW1lOiBcImEgY2FtcGFpZ24gb3duZXIgc2hvdWxkIGJlIGFibGUgdG8gdXBkYXRlIHRoZSB0aXRsZSwgZGVzY3JpcHRpb24sIGFuZCBsaW5rIG9mIGEgY2FtcGFpZ25cIixcbiAgICBhc3luYyBmbihjaGFpbjogQ2hhaW4sIGFjY291bnRzOiBNYXA8c3RyaW5nLCBBY2NvdW50Pikge1xuXG4gICAgICAgIGNvbnN0IHdhbGxldF8xID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzFcIikhLmFkZHJlc3NcblxuICAgICAgICBsZXQgYmxvY2sgPSBjaGFpbi5taW5lQmxvY2soW1xuICAgICAgICAgICAgVHguY29udHJhY3RDYWxsKCdjbGVhcmZ1bmQnLCAnbGF1bmNoJywgW3R5cGVzLnV0ZjgoJ1Rlc3QgQ2FtcGFpZ24nKSwgdHlwZXMuYnVmZignVGhpcyBpcyBhIGNhbXBhaWduIHRoYXQgSSBtYWRlLicpLCB0eXBlcy51dGY4KCdodHRwczovL2V4YW1wbGUuY29tJyksIHR5cGVzLnVpbnQoMTAwMDApLCB0eXBlcy51aW50KDIpLCB0eXBlcy51aW50KDEwMCldLCB3YWxsZXRfMSlcbiAgICAgICAgXSk7XG5cbiAgICAgICAgY2hhaW4ubWluZUVtcHR5QmxvY2tVbnRpbCg1KVxuXG4gICAgICAgIGxldCBibG9jazIgPSBjaGFpbi5taW5lQmxvY2soW1xuICAgICAgICAgICAgVHguY29udHJhY3RDYWxsKCdjbGVhcmZ1bmQnLCAndXBkYXRlJywgW3R5cGVzLnVpbnQoMSksIHR5cGVzLnV0ZjgoXCJOZXcgVGl0bGVcIiksIHR5cGVzLmJ1ZmYoXCJOZXcgZGVzY3JpcHRpb25cIiksIHR5cGVzLnV0ZjgoXCJodHRwczovL25ld2V4YW1wbGUub3JnXCIpXSwgd2FsbGV0XzEpXG4gICAgICAgIF0pXG5cbiAgICAgICAgY29uc3QgdXBkYXRlZENhbXBhaWduID0gY2hhaW4uY2FsbFJlYWRPbmx5Rm4oXG4gICAgICAgICAgICAnY2xlYXJmdW5kJyxcbiAgICAgICAgICAgICdnZXQtY2FtcGFpZ24nLFxuICAgICAgICAgICAgW3R5cGVzLnVpbnQoMSldLFxuICAgICAgICAgICAgd2FsbGV0XzFcbiAgICAgICAgKTtcblxuICAgICAgICBjb25zdCBleHBlY3RlZENhbXBhaWduID0gdXBkYXRlZENhbXBhaWduLnJlc3VsdDtcbiAgICAgICAgY29uc29sZS5sb2coZXhwZWN0ZWRDYW1wYWlnbilcbiAgICAgICAgZXhwZWN0ZWRDYW1wYWlnbi5leHBlY3RPaygpO1xuICAgICAgICBhc3NlcnRFcXVhbHMoZXhwZWN0ZWRDYW1wYWlnbiwgJyhvayB7Y2FtcGFpZ25Pd25lcjogU1QxU0ozRFRFNURON1g1NFlESDVENjRSM0JDQjZBMkFHMlpROFlQRDUsIGNsYWltZWQ6IGZhbHNlLCBkZXNjcmlwdGlvbjogMHg0ZTY1NzcyMDY0NjU3MzYzNzI2OTcwNzQ2OTZmNmUsIGVuZHNBdDogdTEwMCwgZnVuZEdvYWw6IHUxMDAwMCwgbGluazogdVwiaHR0cHM6Ly9uZXdleGFtcGxlLm9yZ1wiLCBwbGVkZ2VkQW1vdW50OiB1MCwgcGxlZGdlZENvdW50OiB1MCwgc3RhcnRzQXQ6IHUyLCB0YXJnZXRSZWFjaGVkOiBmYWxzZSwgdGFyZ2V0UmVhY2hlZEJ5OiB1MCwgdGl0bGU6IHVcIk5ldyBUaXRsZVwifSknKTtcbiAgICB9LFxufSk7XG5cbi8vIGEgdXNlciB3aG8gZG9lcyBub3Qgb3duIGEgY2FtcGFpZ24gc2hvdWxkIG5vdCBiZSBhYmxlIHRvIHVwZGF0ZSBhbnkgaW5mb3JtYXRpb25cbkNsYXJpbmV0LnRlc3Qoe1xuICAgIG5hbWU6IFwiYSB1c2VyIHdobyBkb2VzIG5vdCBvd24gYSBjYW1wYWlnbiBzaG91bGQgbm90IGJlIGFibGUgdG8gdXBkYXRlIGFueSBpbmZvcm1hdGlvblwiLFxuICAgIGFzeW5jIGZuKGNoYWluOiBDaGFpbiwgYWNjb3VudHM6IE1hcDxzdHJpbmcsIEFjY291bnQ+KSB7XG5cbiAgICAgICAgY29uc3Qgd2FsbGV0XzEgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfMVwiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCB3YWxsZXRfMiA9IGFjY291bnRzLmdldChcIndhbGxldF8yXCIpIS5hZGRyZXNzXG5cbiAgICAgICAgbGV0IGJsb2NrID0gY2hhaW4ubWluZUJsb2NrKFtcbiAgICAgICAgICAgIFR4LmNvbnRyYWN0Q2FsbCgnY2xlYXJmdW5kJywgJ2xhdW5jaCcsIFt0eXBlcy51dGY4KCdUZXN0IENhbXBhaWduJyksIHR5cGVzLmJ1ZmYoJ1RoaXMgaXMgYSBjYW1wYWlnbiB0aGF0IEkgbWFkZS4nKSwgdHlwZXMudXRmOCgnaHR0cHM6Ly9leGFtcGxlLmNvbScpLCB0eXBlcy51aW50KDEwMDAwKSwgdHlwZXMudWludCgyKSwgdHlwZXMudWludCgxMDApXSwgd2FsbGV0XzEpXG4gICAgICAgIF0pO1xuXG4gICAgICAgIGNoYWluLm1pbmVFbXB0eUJsb2NrVW50aWwoNSlcblxuICAgICAgICBsZXQgYmxvY2syID0gY2hhaW4ubWluZUJsb2NrKFtcbiAgICAgICAgICAgIFR4LmNvbnRyYWN0Q2FsbCgnY2xlYXJmdW5kJywgJ3VwZGF0ZScsIFt0eXBlcy51aW50KDEpLCB0eXBlcy51dGY4KFwiTmV3IFRpdGxlXCIpLCB0eXBlcy5idWZmKFwiTmV3IGRlc2NyaXB0aW9uXCIpLCB0eXBlcy51dGY4KFwiaHR0cHM6Ly9uZXdleGFtcGxlLm9yZ1wiKV0sIHdhbGxldF8yKVxuICAgICAgICBdKVxuXG4gICAgICAgIGNvbnN0IGV4cGVjdGVkQ2FtcGFpZ24gPSBibG9jazIucmVjZWlwdHNbMF0ucmVzdWx0XG5cbiAgICAgICAgZXhwZWN0ZWRDYW1wYWlnbi5leHBlY3RFcnIoKTtcbiAgICB9LFxufSk7XG5cbi8vIGEgY2FtcGFpZ24gb3duZXIgc2hvdWxkIG5vdCBiZSBhYmxlIHRvIHVwZGF0ZSBhIGNhbXBhaWduIGFmdGVyIGl0IGhhcyBlbmRlZFxuQ2xhcmluZXQudGVzdCh7XG4gICAgbmFtZTogXCJhIGNhbXBhaWduIG93bmVyIHNob3VsZCBub3QgYmUgYWJsZSB0byB1cGRhdGUgYSBjYW1wYWlnbiBhZnRlciBpdCBoYXMgZW5kZWRcIixcbiAgICBhc3luYyBmbihjaGFpbjogQ2hhaW4sIGFjY291bnRzOiBNYXA8c3RyaW5nLCBBY2NvdW50Pikge1xuXG4gICAgICAgIGNvbnN0IHdhbGxldF8xID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzFcIikhLmFkZHJlc3NcblxuICAgICAgICBsZXQgYmxvY2sgPSBjaGFpbi5taW5lQmxvY2soW1xuICAgICAgICAgICAgVHguY29udHJhY3RDYWxsKCdjbGVhcmZ1bmQnLCAnbGF1bmNoJywgW3R5cGVzLnV0ZjgoJ1Rlc3QgQ2FtcGFpZ24nKSwgdHlwZXMuYnVmZignVGhpcyBpcyBhIGNhbXBhaWduIHRoYXQgSSBtYWRlLicpLCB0eXBlcy51dGY4KCdodHRwczovL2V4YW1wbGUuY29tJyksIHR5cGVzLnVpbnQoMTAwMDApLCB0eXBlcy51aW50KDIpLCB0eXBlcy51aW50KDEwMCldLCB3YWxsZXRfMSlcbiAgICAgICAgXSk7XG5cbiAgICAgICAgY2hhaW4ubWluZUVtcHR5QmxvY2tVbnRpbCgyMDApXG5cbiAgICAgICAgbGV0IGJsb2NrMiA9IGNoYWluLm1pbmVCbG9jayhbXG4gICAgICAgICAgICBUeC5jb250cmFjdENhbGwoJ2NsZWFyZnVuZCcsICd1cGRhdGUnLCBbdHlwZXMudWludCgxKSwgdHlwZXMudXRmOChcIk5ldyBUaXRsZVwiKSwgdHlwZXMuYnVmZihcIk5ldyBkZXNjcmlwdGlvblwiKSwgdHlwZXMudXRmOChcImh0dHBzOi8vbmV3ZXhhbXBsZS5vcmdcIildLCB3YWxsZXRfMSlcbiAgICAgICAgXSlcblxuICAgICAgICBjb25zdCBleHBlY3RlZENhbXBhaWduID0gYmxvY2syLnJlY2VpcHRzWzBdLnJlc3VsdFxuXG4gICAgICAgIGV4cGVjdGVkQ2FtcGFpZ24uZXhwZWN0RXJyKCk7XG4gICAgfSxcbn0pO1xuXG4vLyBDTEFJTUlORyBDQU1QQUlHTiBGVU5EU1xuLy8gYSBjYW1wYWlnbiBvd25lciBzaG91bGQgYmUgYWJsZSB0byBjb2xsZWN0IGZ1bmRzIGFmdGVyIHRoZSBmdW5kaW5nIGdvYWwgaGFzIGJlZW4gcmVhY2hlZFxuQ2xhcmluZXQudGVzdCh7XG4gICAgbmFtZTogXCJhIGNhbXBhaWduIG93bmVyIHNob3VsZCBiZSBhYmxlIHRvIGNvbGxlY3QgZnVuZHMgYWZ0ZXIgdGhlIGZ1bmRpbmcgZ29hbCBoYXMgYmVlbiByZWFjaGVkXCIsXG4gICAgYXN5bmMgZm4oY2hhaW46IENoYWluLCBhY2NvdW50czogTWFwPHN0cmluZywgQWNjb3VudD4pIHtcblxuICAgICAgICBjb25zdCB3YWxsZXRfMSA9IGFjY291bnRzLmdldChcIndhbGxldF8xXCIpIS5hZGRyZXNzXG4gICAgICAgIGNvbnN0IHdhbGxldF8yID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzJcIikhLmFkZHJlc3NcblxuICAgICAgICBsZXQgYmxvY2sgPSBjaGFpbi5taW5lQmxvY2soW1xuICAgICAgICAgICAgVHguY29udHJhY3RDYWxsKCdjbGVhcmZ1bmQnLCAnbGF1bmNoJywgW3R5cGVzLnV0ZjgoJ1Rlc3QgQ2FtcGFpZ24nKSwgdHlwZXMuYnVmZignVGhpcyBpcyBhIGNhbXBhaWduIHRoYXQgSSBtYWRlLicpLCB0eXBlcy51dGY4KCdodHRwczovL2V4YW1wbGUuY29tJyksIHR5cGVzLnVpbnQoMTAwMDApLCB0eXBlcy51aW50KDIpLCB0eXBlcy51aW50KDEwMCldLCB3YWxsZXRfMSlcbiAgICAgICAgXSk7XG5cbiAgICAgICAgY2hhaW4ubWluZUVtcHR5QmxvY2tVbnRpbCg1KVxuXG4gICAgICAgIGxldCBibG9jazIgPSBjaGFpbi5taW5lQmxvY2soW1xuICAgICAgICAgICAgVHguY29udHJhY3RDYWxsKCdjbGVhcmZ1bmQnLCAncGxlZGdlJywgW3R5cGVzLnVpbnQoMSksIHR5cGVzLnVpbnQoMjAwMDApXSwgd2FsbGV0XzIpXG4gICAgICAgIF0pXG5cbiAgICAgICAgbGV0IGJsb2NrMyA9IGNoYWluLm1pbmVCbG9jayhbXG4gICAgICAgICAgICBUeC5jb250cmFjdENhbGwoJ2NsZWFyZnVuZCcsICdjbGFpbScsIFt0eXBlcy51aW50KDEpXSwgd2FsbGV0XzEpXG4gICAgICAgIF0pXG5cbiAgICAgICAgY29uc3QgY2xhaW1lZENhbXBhaWduQmxvY2sgPSBibG9jazMucmVjZWlwdHNbMF0ucmVzdWx0XG5cbiAgICAgICAgY2xhaW1lZENhbXBhaWduQmxvY2suZXhwZWN0T2soKTtcblxuICAgICAgICBjb25zdCBjbGFpbWVkQ2FtcGFpZ24gPSBjaGFpbi5jYWxsUmVhZE9ubHlGbihcbiAgICAgICAgICAgICdjbGVhcmZ1bmQnLFxuICAgICAgICAgICAgJ2dldC1jYW1wYWlnbicsXG4gICAgICAgICAgICBbdHlwZXMudWludCgxKV0sXG4gICAgICAgICAgICB3YWxsZXRfMVxuICAgICAgICApO1xuXG4gICAgICAgIGNvbnN0IGV4cGVjdGVkQ2FtcGFpZ24gPSBjbGFpbWVkQ2FtcGFpZ24ucmVzdWx0O1xuICAgICAgICBleHBlY3RlZENhbXBhaWduLmV4cGVjdE9rKCk7XG4gICAgICAgIGFzc2VydEVxdWFscyhleHBlY3RlZENhbXBhaWduLCAnKG9rIHtjYW1wYWlnbk93bmVyOiBTVDFTSjNEVEU1RE43WDU0WURINUQ2NFIzQkNCNkEyQUcyWlE4WVBENSwgY2xhaW1lZDogdHJ1ZSwgZGVzY3JpcHRpb246IDB4NTQ2ODY5NzMyMDY5NzMyMDYxMjA2MzYxNmQ3MDYxNjk2NzZlMjA3NDY4NjE3NDIwNDkyMDZkNjE2NDY1MmUsIGVuZHNBdDogdTEwMCwgZnVuZEdvYWw6IHUxMDAwMCwgbGluazogdVwiaHR0cHM6Ly9leGFtcGxlLmNvbVwiLCBwbGVkZ2VkQW1vdW50OiB1MjAwMDAsIHBsZWRnZWRDb3VudDogdTEsIHN0YXJ0c0F0OiB1MiwgdGFyZ2V0UmVhY2hlZDogdHJ1ZSwgdGFyZ2V0UmVhY2hlZEJ5OiB1NiwgdGl0bGU6IHVcIlRlc3QgQ2FtcGFpZ25cIn0pJyk7XG4gICAgfSxcbn0pO1xuXG4vLyBhIGNhbXBhaWduIG93bmVyIHNob3VsZCBub3QgYmUgYWJsZSB0byBjb2xsZWN0IGZ1bmRzIGJlZm9yZSBmdW5kaW5nIGdvYWwgaGFzIGJlZW4gcmVhY2hlZFxuQ2xhcmluZXQudGVzdCh7XG4gICAgbmFtZTogXCJhIGNhbXBhaWduIG93bmVyIHNob3VsZCBub3QgYmUgYWJsZSB0byBjb2xsZWN0IGZ1bmRzIGJlZm9yZSBmdW5kaW5nIGdvYWwgaGFzIGJlZW4gcmVhY2hlZFwiLFxuICAgIGFzeW5jIGZuKGNoYWluOiBDaGFpbiwgYWNjb3VudHM6IE1hcDxzdHJpbmcsIEFjY291bnQ+KSB7XG5cbiAgICAgICAgY29uc3Qgd2FsbGV0XzEgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfMVwiKSEuYWRkcmVzc1xuXG4gICAgICAgIGxldCBibG9jayA9IGNoYWluLm1pbmVCbG9jayhbXG4gICAgICAgICAgICBUeC5jb250cmFjdENhbGwoJ2NsZWFyZnVuZCcsICdsYXVuY2gnLCBbdHlwZXMudXRmOCgnVGVzdCBDYW1wYWlnbicpLCB0eXBlcy5idWZmKCdUaGlzIGlzIGEgY2FtcGFpZ24gdGhhdCBJIG1hZGUuJyksIHR5cGVzLnV0ZjgoJ2h0dHBzOi8vZXhhbXBsZS5jb20nKSwgdHlwZXMudWludCgxMDAwMCksIHR5cGVzLnVpbnQoMiksIHR5cGVzLnVpbnQoMTAwKV0sIHdhbGxldF8xKVxuICAgICAgICBdKTtcblxuICAgICAgICBjaGFpbi5taW5lRW1wdHlCbG9ja1VudGlsKDUpXG5cbiAgICAgICAgbGV0IGJsb2NrMiA9IGNoYWluLm1pbmVCbG9jayhbXG4gICAgICAgICAgICBUeC5jb250cmFjdENhbGwoJ2NsZWFyZnVuZCcsICdjbGFpbScsIFt0eXBlcy51aW50KDEpXSwgd2FsbGV0XzEpXG4gICAgICAgIF0pXG5cbiAgICAgICAgY29uc3QgY2xhaW1lZENhbXBhaWduQmxvY2sgPSBibG9jazIucmVjZWlwdHNbMF0ucmVzdWx0XG5cbiAgICAgICAgY2xhaW1lZENhbXBhaWduQmxvY2suZXhwZWN0RXJyKCk7XG5cbiAgICAgICAgY29uc3QgY2xhaW1lZENhbXBhaWduID0gY2hhaW4uY2FsbFJlYWRPbmx5Rm4oXG4gICAgICAgICAgICAnY2xlYXJmdW5kJyxcbiAgICAgICAgICAgICdnZXQtY2FtcGFpZ24nLFxuICAgICAgICAgICAgW3R5cGVzLnVpbnQoMSldLFxuICAgICAgICAgICAgd2FsbGV0XzFcbiAgICAgICAgKTtcblxuICAgICAgICBjb25zdCBleHBlY3RlZENhbXBhaWduID0gY2xhaW1lZENhbXBhaWduLnJlc3VsdDtcbiAgICAgICAgZXhwZWN0ZWRDYW1wYWlnbi5leHBlY3RPaygpO1xuICAgICAgICBhc3NlcnRFcXVhbHMoZXhwZWN0ZWRDYW1wYWlnbiwgJyhvayB7Y2FtcGFpZ25Pd25lcjogU1QxU0ozRFRFNURON1g1NFlESDVENjRSM0JDQjZBMkFHMlpROFlQRDUsIGNsYWltZWQ6IGZhbHNlLCBkZXNjcmlwdGlvbjogMHg1NDY4Njk3MzIwNjk3MzIwNjEyMDYzNjE2ZDcwNjE2OTY3NmUyMDc0Njg2MTc0MjA0OTIwNmQ2MTY0NjUyZSwgZW5kc0F0OiB1MTAwLCBmdW5kR29hbDogdTEwMDAwLCBsaW5rOiB1XCJodHRwczovL2V4YW1wbGUuY29tXCIsIHBsZWRnZWRBbW91bnQ6IHUwLCBwbGVkZ2VkQ291bnQ6IHUwLCBzdGFydHNBdDogdTIsIHRhcmdldFJlYWNoZWQ6IGZhbHNlLCB0YXJnZXRSZWFjaGVkQnk6IHUwLCB0aXRsZTogdVwiVGVzdCBDYW1wYWlnblwifSknKTtcbiAgICB9LFxufSk7XG5cbi8vIGEgY2FtcGFpZ24gb3duZXIgc2hvdWxkIG5vdCBiZSBhYmxlIHRvIGNsYWltIGZ1bmRzIHR3aWNlXG5DbGFyaW5ldC50ZXN0KHtcbiAgICBuYW1lOiBcImEgY2FtcGFpZ24gb3duZXIgc2hvdWxkIG5vdCBiZSBhYmxlIHRvIGNsYWltIGZ1bmRzIHR3aWNlXCIsXG4gICAgYXN5bmMgZm4oY2hhaW46IENoYWluLCBhY2NvdW50czogTWFwPHN0cmluZywgQWNjb3VudD4pIHtcblxuICAgICAgICBjb25zdCB3YWxsZXRfMSA9IGFjY291bnRzLmdldChcIndhbGxldF8xXCIpIS5hZGRyZXNzXG4gICAgICAgIGNvbnN0IHdhbGxldF8yID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzJcIikhLmFkZHJlc3NcblxuICAgICAgICBsZXQgYmxvY2sgPSBjaGFpbi5taW5lQmxvY2soW1xuICAgICAgICAgICAgVHguY29udHJhY3RDYWxsKCdjbGVhcmZ1bmQnLCAnbGF1bmNoJywgW3R5cGVzLnV0ZjgoJ1Rlc3QgQ2FtcGFpZ24nKSwgdHlwZXMuYnVmZignVGhpcyBpcyBhIGNhbXBhaWduIHRoYXQgSSBtYWRlLicpLCB0eXBlcy51dGY4KCdodHRwczovL2V4YW1wbGUuY29tJyksIHR5cGVzLnVpbnQoMTAwMDApLCB0eXBlcy51aW50KDIpLCB0eXBlcy51aW50KDEwMCldLCB3YWxsZXRfMSlcbiAgICAgICAgXSk7XG5cbiAgICAgICAgY2hhaW4ubWluZUVtcHR5QmxvY2tVbnRpbCg1KVxuXG4gICAgICAgIGxldCBibG9jazIgPSBjaGFpbi5taW5lQmxvY2soW1xuICAgICAgICAgICAgVHguY29udHJhY3RDYWxsKCdjbGVhcmZ1bmQnLCAncGxlZGdlJywgW3R5cGVzLnVpbnQoMSksIHR5cGVzLnVpbnQoMjAwMDApXSwgd2FsbGV0XzIpXG4gICAgICAgIF0pXG5cbiAgICAgICAgbGV0IGJsb2NrMyA9IGNoYWluLm1pbmVCbG9jayhbXG4gICAgICAgICAgICBUeC5jb250cmFjdENhbGwoJ2NsZWFyZnVuZCcsICdjbGFpbScsIFt0eXBlcy51aW50KDEpXSwgd2FsbGV0XzEpXG4gICAgICAgIF0pXG5cbiAgICAgICAgY29uc3QgY2xhaW1lZENhbXBhaWduQmxvY2sgPSBibG9jazMucmVjZWlwdHNbMF0ucmVzdWx0XG5cbiAgICAgICAgY2xhaW1lZENhbXBhaWduQmxvY2suZXhwZWN0T2soKTtcblxuICAgICAgICBjb25zdCBjbGFpbWVkQ2FtcGFpZ24gPSBjaGFpbi5jYWxsUmVhZE9ubHlGbihcbiAgICAgICAgICAgICdjbGVhcmZ1bmQnLFxuICAgICAgICAgICAgJ2dldC1jYW1wYWlnbicsXG4gICAgICAgICAgICBbdHlwZXMudWludCgxKV0sXG4gICAgICAgICAgICB3YWxsZXRfMVxuICAgICAgICApO1xuXG4gICAgICAgIGNvbnN0IGV4cGVjdGVkQ2FtcGFpZ24gPSBjbGFpbWVkQ2FtcGFpZ24ucmVzdWx0O1xuICAgICAgICBleHBlY3RlZENhbXBhaWduLmV4cGVjdE9rKCk7XG4gICAgICAgIGFzc2VydEVxdWFscyhleHBlY3RlZENhbXBhaWduLCAnKG9rIHtjYW1wYWlnbk93bmVyOiBTVDFTSjNEVEU1RE43WDU0WURINUQ2NFIzQkNCNkEyQUcyWlE4WVBENSwgY2xhaW1lZDogdHJ1ZSwgZGVzY3JpcHRpb246IDB4NTQ2ODY5NzMyMDY5NzMyMDYxMjA2MzYxNmQ3MDYxNjk2NzZlMjA3NDY4NjE3NDIwNDkyMDZkNjE2NDY1MmUsIGVuZHNBdDogdTEwMCwgZnVuZEdvYWw6IHUxMDAwMCwgbGluazogdVwiaHR0cHM6Ly9leGFtcGxlLmNvbVwiLCBwbGVkZ2VkQW1vdW50OiB1MjAwMDAsIHBsZWRnZWRDb3VudDogdTEsIHN0YXJ0c0F0OiB1MiwgdGFyZ2V0UmVhY2hlZDogdHJ1ZSwgdGFyZ2V0UmVhY2hlZEJ5OiB1NiwgdGl0bGU6IHVcIlRlc3QgQ2FtcGFpZ25cIn0pJyk7XG5cbiAgICAgICAgbGV0IGJsb2NrNCA9IGNoYWluLm1pbmVCbG9jayhbXG4gICAgICAgICAgICBUeC5jb250cmFjdENhbGwoJ2NsZWFyZnVuZCcsICdjbGFpbScsIFt0eXBlcy51aW50KDEpXSwgd2FsbGV0XzEpXG4gICAgICAgIF0pXG5cbiAgICAgICAgY29uc3QgZmFpbGVkQ2xhaW0gPSBibG9jazQucmVjZWlwdHNbMF0ucmVzdWx0O1xuICAgICAgICBmYWlsZWRDbGFpbS5leHBlY3RFcnIoKTtcbiAgICAgICAgYXNzZXJ0RXF1YWxzKGZhaWxlZENsYWltLCAnKGVyciB1MTE2KScpXG4gICAgfSxcbn0pO1xuXG4vLyBhIHVzZXIgd2hvIGRvZXMgbm90IG93biBhIGNhbXBhaWduIHNob3VsZCBub3QgYmUgYWJsZSB0byBjbGFpbSBmdW5kc1xuQ2xhcmluZXQudGVzdCh7XG4gICAgbmFtZTogXCJhIHVzZXIgd2hvIGRvZXMgbm90IG93biBhIGNhbXBhaWduIHNob3VsZCBub3QgYmUgYWJsZSB0byBjbGFpbSBmdW5kc1wiLFxuICAgIGFzeW5jIGZuKGNoYWluOiBDaGFpbiwgYWNjb3VudHM6IE1hcDxzdHJpbmcsIEFjY291bnQ+KSB7XG5cbiAgICAgICAgY29uc3Qgd2FsbGV0XzEgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfMVwiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCB3YWxsZXRfMiA9IGFjY291bnRzLmdldChcIndhbGxldF8yXCIpIS5hZGRyZXNzXG5cbiAgICAgICAgbGV0IGJsb2NrID0gY2hhaW4ubWluZUJsb2NrKFtcbiAgICAgICAgICAgIFR4LmNvbnRyYWN0Q2FsbCgnY2xlYXJmdW5kJywgJ2xhdW5jaCcsIFt0eXBlcy51dGY4KCdUZXN0IENhbXBhaWduJyksIHR5cGVzLmJ1ZmYoJ1RoaXMgaXMgYSBjYW1wYWlnbiB0aGF0IEkgbWFkZS4nKSwgdHlwZXMudXRmOCgnaHR0cHM6Ly9leGFtcGxlLmNvbScpLCB0eXBlcy51aW50KDEwMDAwKSwgdHlwZXMudWludCgyKSwgdHlwZXMudWludCgxMDApXSwgd2FsbGV0XzEpXG4gICAgICAgIF0pO1xuXG4gICAgICAgIGNoYWluLm1pbmVFbXB0eUJsb2NrVW50aWwoNSlcblxuICAgICAgICBsZXQgYmxvY2syID0gY2hhaW4ubWluZUJsb2NrKFtcbiAgICAgICAgICAgIFR4LmNvbnRyYWN0Q2FsbCgnY2xlYXJmdW5kJywgJ3BsZWRnZScsIFt0eXBlcy51aW50KDEpLCB0eXBlcy51aW50KDIwMDAwKV0sIHdhbGxldF8yKVxuICAgICAgICBdKVxuXG4gICAgICAgIGxldCBibG9jazMgPSBjaGFpbi5taW5lQmxvY2soW1xuICAgICAgICAgICAgVHguY29udHJhY3RDYWxsKCdjbGVhcmZ1bmQnLCAnY2xhaW0nLCBbdHlwZXMudWludCgxKV0sIHdhbGxldF8yKVxuICAgICAgICBdKVxuXG4gICAgICAgIGNvbnN0IGNsYWltZWRDYW1wYWlnbiA9IGJsb2NrMy5yZWNlaXB0c1swXS5yZXN1bHRcblxuICAgICAgICBjbGFpbWVkQ2FtcGFpZ24uZXhwZWN0RXJyKCk7XG4gICAgICAgIGFzc2VydEVxdWFscyhjbGFpbWVkQ2FtcGFpZ24sICcoZXJyIHUxMDcpJyk7XG4gICAgfSxcbn0pO1xuXG4vLyBQTEVER0lORyBUTyBBIENBTVBBSUdOXG5DbGFyaW5ldC50ZXN0KHtcbiAgICBuYW1lOiBcInBsZWRnZTogYSB1c2VyIHNob3VsZCBiZSBhYmxlIHRvIGludmVzdCBpbiBhIGNhbXBhaWduIHRoYXQgaXMgYWN0aXZlXCIsXG4gICAgYXN5bmMgZm4oY2hhaW46IENoYWluLCBhY2NvdW50czogTWFwPHN0cmluZywgQWNjb3VudD4pIHtcbiAgICAgICAgY29uc3QgZGVwbG95ZXIgPSBhY2NvdW50cy5nZXQoXCJkZXBsb3llclwiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCB3YWxsZXQxID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzFcIikhLmFkZHJlc3NcbiAgICAgICAgY29uc3Qgd2FsbGV0MiA9IGFjY291bnRzLmdldChcIndhbGxldF8yXCIpIS5hZGRyZXNzXG5cbiAgICAgICAgY2hhaW4ubWluZUJsb2NrKFsgbGF1bmNoKHdhbGxldDEpIF0pXG4gICAgICAgIGNoYWluLm1pbmVFbXB0eUJsb2NrVW50aWwoNDApXG5cbiAgICAgICAgY29uc3QgYmxvY2sgPSBjaGFpbi5taW5lQmxvY2soWyBwbGVkZ2Uod2FsbGV0MikgXSlcbiAgICAgICAgYmxvY2sucmVjZWlwdHNbMF0ucmVzdWx0LmV4cGVjdE9rKCkuZXhwZWN0Qm9vbCh0cnVlKVxuICAgIH0sXG59KTtcblxuQ2xhcmluZXQudGVzdCh7XG4gICAgbmFtZTogXCJwbGVkZ2U6IHRoZSBwbGVkZ2VkIGFtb3VudCBzaG91bGQgdHJhbnNmZXIgdG8gY2xlYXJmdW5kIGNvbnRyYWN0IG9uIHN1Y2Nlc3NmdWwgcGxlZGdlXCIsXG4gICAgYXN5bmMgZm4oY2hhaW46IENoYWluLCBhY2NvdW50czogTWFwPHN0cmluZywgQWNjb3VudD4pIHtcbiAgICAgICAgY29uc3QgZGVwbG95ZXIgPSBhY2NvdW50cy5nZXQoXCJkZXBsb3llclwiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCB3YWxsZXQxID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzFcIikhLmFkZHJlc3NcbiAgICAgICAgY29uc3Qgd2FsbGV0MiA9IGFjY291bnRzLmdldChcIndhbGxldF8yXCIpIS5hZGRyZXNzXG5cbiAgICAgICAgY2hhaW4ubWluZUJsb2NrKFsgbGF1bmNoKHdhbGxldDEpIF0pXG4gICAgICAgIGNoYWluLm1pbmVFbXB0eUJsb2NrVW50aWwoNDApXG4gICAgICAgIGNoYWluLm1pbmVCbG9jayhbIHBsZWRnZSh3YWxsZXQyKSBdKVxuXG4gICAgICAgIGNvbnN0IGFzc2V0c01hcHMgPSBjaGFpbi5nZXRBc3NldHNNYXBzKClcbiAgICAgICAgY29uc3Qgc3R4RnVuZHNUcmFuc2ZlcnJlZFRvQ2xlYXJmdW5kID0gYXNzZXRzTWFwcy5hc3NldHNbXCJTVFhcIl1bYCR7ZGVwbG95ZXJ9LmNsZWFyZnVuZGBdXG4gICAgICAgIGFzc2VydEVxdWFscyhzdHhGdW5kc1RyYW5zZmVycmVkVG9DbGVhcmZ1bmQsIDEwMDApXG4gICAgfSxcbn0pO1xuXG5DbGFyaW5ldC50ZXN0KHtcbiAgICBuYW1lOiBcInBsZWRnZTogdGhlIGNvdW50IG9mIGludmVzdG9ycyBzaG91bGQgaW5jcmVtZW50IHdoZW4gYSBuZXcgaW52ZXN0b3IgcGxlZGdlc1wiLFxuICAgIGFzeW5jIGZuKGNoYWluOiBDaGFpbiwgYWNjb3VudHM6IE1hcDxzdHJpbmcsIEFjY291bnQ+KSB7XG4gICAgICAgIGNvbnN0IGRlcGxveWVyID0gYWNjb3VudHMuZ2V0KFwiZGVwbG95ZXJcIikhLmFkZHJlc3NcbiAgICAgICAgY29uc3Qgd2FsbGV0MSA9IGFjY291bnRzLmdldChcIndhbGxldF8xXCIpIS5hZGRyZXNzXG4gICAgICAgIGNvbnN0IHdhbGxldDIgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfMlwiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCB3YWxsZXQzID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzNcIikhLmFkZHJlc3NcbiAgICAgICAgY29uc3Qgd2FsbGV0NCA9IGFjY291bnRzLmdldChcIndhbGxldF80XCIpIS5hZGRyZXNzXG5cbiAgICAgICAgY2hhaW4ubWluZUJsb2NrKFsgbGF1bmNoKHdhbGxldDEpIF0pXG4gICAgICAgIGNoYWluLm1pbmVFbXB0eUJsb2NrVW50aWwoNDApXG4gICAgICAgIGNoYWluLm1pbmVCbG9jayhbIHBsZWRnZSh3YWxsZXQyKSwgcGxlZGdlKHdhbGxldDMpLCBwbGVkZ2Uod2FsbGV0NCkgXSlcblxuICAgICAgICBjb25zdCBjYW1wYWlnbiA9IGdldENhbXBhaWduKGNoYWluLCBkZXBsb3llcilcbiAgICAgICAgY2FtcGFpZ24ucmVzdWx0LmV4cGVjdE9rKCkuZXhwZWN0VHVwbGUoKVxuICAgICAgICBhc3NlcnRTdHJpbmdJbmNsdWRlcyhjYW1wYWlnbi5yZXN1bHQsIFwicGxlZGdlZENvdW50OiB1M1wiKVxuICAgIH0sXG59KTtcblxuQ2xhcmluZXQudGVzdCh7XG4gICAgbmFtZTogXCJwbGVkZ2U6IHRoZSBjb3VudCBvZiBpbnZlc3RvcnMgc2hvdWxkIHN0YXkgdGhlIHNhbWUgd2hlbiBhbiBpbnZlc3RvciBwbGVkZ2VzIGFnYWluXCIsXG4gICAgYXN5bmMgZm4oY2hhaW46IENoYWluLCBhY2NvdW50czogTWFwPHN0cmluZywgQWNjb3VudD4pIHtcbiAgICAgICAgY29uc3QgZGVwbG95ZXIgPSBhY2NvdW50cy5nZXQoXCJkZXBsb3llclwiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCB3YWxsZXQxID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzFcIikhLmFkZHJlc3NcbiAgICAgICAgY29uc3Qgd2FsbGV0MiA9IGFjY291bnRzLmdldChcIndhbGxldF8yXCIpIS5hZGRyZXNzXG4gICAgICAgIGNvbnN0IHdhbGxldDMgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfM1wiKSEuYWRkcmVzc1xuXG4gICAgICAgIGNoYWluLm1pbmVCbG9jayhbIGxhdW5jaCh3YWxsZXQxKSBdKVxuICAgICAgICBjaGFpbi5taW5lRW1wdHlCbG9ja1VudGlsKDQwKVxuICAgICAgICBjaGFpbi5taW5lQmxvY2soWyBwbGVkZ2Uod2FsbGV0MiksIHBsZWRnZSh3YWxsZXQzKSwgcGxlZGdlKHdhbGxldDIpLCBwbGVkZ2Uod2FsbGV0MykgXSlcblxuICAgICAgICBjb25zdCBjYW1wYWlnbiA9IGdldENhbXBhaWduKGNoYWluLCBkZXBsb3llcilcbiAgICAgICAgY2FtcGFpZ24ucmVzdWx0LmV4cGVjdE9rKCkuZXhwZWN0VHVwbGUoKVxuICAgICAgICBhc3NlcnRTdHJpbmdJbmNsdWRlcyhjYW1wYWlnbi5yZXN1bHQsIFwicGxlZGdlZENvdW50OiB1MlwiKVxuICAgIH0sXG59KTtcblxuQ2xhcmluZXQudGVzdCh7XG4gICAgbmFtZTogXCJwbGVkZ2U6IHRoZSBwbGVkZ2VkIGFtb3VudCBzaG91bGQgaW5jcmVhc2Ugd2hlbiBhbiBpbnZlc3RvciBwbGVkZ2VzXCIsXG4gICAgYXN5bmMgZm4oY2hhaW46IENoYWluLCBhY2NvdW50czogTWFwPHN0cmluZywgQWNjb3VudD4pIHtcbiAgICAgICAgY29uc3QgZGVwbG95ZXIgPSBhY2NvdW50cy5nZXQoXCJkZXBsb3llclwiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCB3YWxsZXQxID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzFcIikhLmFkZHJlc3NcbiAgICAgICAgY29uc3Qgd2FsbGV0MiA9IGFjY291bnRzLmdldChcIndhbGxldF8yXCIpIS5hZGRyZXNzXG4gICAgICAgIGNvbnN0IHdhbGxldDMgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfM1wiKSEuYWRkcmVzc1xuXG4gICAgICAgIGNoYWluLm1pbmVCbG9jayhbIGxhdW5jaCh3YWxsZXQxKSBdKVxuICAgICAgICBjaGFpbi5taW5lRW1wdHlCbG9ja1VudGlsKDQwKVxuICAgICAgICBjaGFpbi5taW5lQmxvY2soWyBwbGVkZ2Uod2FsbGV0MiksIHBsZWRnZSh3YWxsZXQzKSwgcGxlZGdlKHdhbGxldDIpLCBwbGVkZ2Uod2FsbGV0MykgXSlcblxuICAgICAgICBjb25zdCBjYW1wYWlnbiA9IGdldENhbXBhaWduKGNoYWluLCBkZXBsb3llcilcbiAgICAgICAgY2FtcGFpZ24ucmVzdWx0LmV4cGVjdE9rKCkuZXhwZWN0VHVwbGUoKVxuICAgICAgICBhc3NlcnRTdHJpbmdJbmNsdWRlcyhjYW1wYWlnbi5yZXN1bHQsIFwicGxlZGdlZEFtb3VudDogdTQwMDBcIilcbiAgICB9LFxufSk7XG5cbkNsYXJpbmV0LnRlc3Qoe1xuICAgIG5hbWU6IFwicGxlZGdlOiB0aGUgcGxlZGdlZCBtb3VudCBzaG91bGQgc2hvdWxkIHJlZmxlY3QgdGhlIGNvcnJlY3QgaW52ZXN0bWVudHMgYnkgdXNlciBpbiBpbnZlc3RtZW50IG1hcCBcIixcbiAgICBhc3luYyBmbihjaGFpbjogQ2hhaW4sIGFjY291bnRzOiBNYXA8c3RyaW5nLCBBY2NvdW50Pikge1xuICAgICAgICBjb25zdCBkZXBsb3llciA9IGFjY291bnRzLmdldChcImRlcGxveWVyXCIpIS5hZGRyZXNzXG4gICAgICAgIGNvbnN0IHdhbGxldDEgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfMVwiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCB3YWxsZXQyID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzJcIikhLmFkZHJlc3NcbiAgICAgICAgY29uc3Qgd2FsbGV0MyA9IGFjY291bnRzLmdldChcIndhbGxldF8zXCIpIS5hZGRyZXNzXG5cbiAgICAgICAgY2hhaW4ubWluZUJsb2NrKFsgbGF1bmNoKHdhbGxldDEpIF0pXG4gICAgICAgIGNoYWluLm1pbmVFbXB0eUJsb2NrVW50aWwoNDApXG4gICAgICAgIGNoYWluLm1pbmVCbG9jayhbIHBsZWRnZSh3YWxsZXQyKSwgcGxlZGdlKHdhbGxldDMpLCBwbGVkZ2Uod2FsbGV0MiksIHBsZWRnZSh3YWxsZXQzKSwgcGxlZGdlKHdhbGxldDMpIF0pXG5cbiAgICAgICAgY29uc3QgaW52ZXN0bWVudFdhbGxldDIgPSBnZXRJbnZlc3RtZW50KGNoYWluLCB3YWxsZXQyKVxuICAgICAgICBpbnZlc3RtZW50V2FsbGV0Mi5yZXN1bHQuZXhwZWN0T2soKS5leHBlY3RTb21lKClcbiAgICAgICAgYXNzZXJ0U3RyaW5nSW5jbHVkZXMoaW52ZXN0bWVudFdhbGxldDIucmVzdWx0LCBcImFtb3VudDogdTIwMDBcIilcblxuICAgICAgICBjb25zdCBpbnZlc3RtZW50V2FsbGV0MyA9IGdldEludmVzdG1lbnQoY2hhaW4sIHdhbGxldDMpXG4gICAgICAgIGludmVzdG1lbnRXYWxsZXQzLnJlc3VsdC5leHBlY3RPaygpLmV4cGVjdFNvbWUoKVxuICAgICAgICBhc3NlcnRTdHJpbmdJbmNsdWRlcyhpbnZlc3RtZW50V2FsbGV0My5yZXN1bHQsIFwiYW1vdW50OiB1MzAwMFwiKVxuICAgIH0sXG59KTtcblxuQ2xhcmluZXQudGVzdCh7XG4gICAgbmFtZTogXCJwbGVkZ2U6IGEgdXNlciBzaG91bGQgbm90IGJlIGFibGUgdG8gaW52ZXN0IGluIGEgY2FtcGFpZ24gdGhhdCB3YXMgbmV2ZXIgbGF1bmNoZWRcIixcbiAgICBhc3luYyBmbihjaGFpbjogQ2hhaW4sIGFjY291bnRzOiBNYXA8c3RyaW5nLCBBY2NvdW50Pikge1xuICAgICAgICBjb25zdCBkZXBsb3llciA9IGFjY291bnRzLmdldChcImRlcGxveWVyXCIpIS5hZGRyZXNzXG4gICAgICAgIGNvbnN0IHdhbGxldDEgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfMVwiKSEuYWRkcmVzc1xuXG4gICAgICAgIGNvbnN0IGJsb2NrID0gY2hhaW4ubWluZUJsb2NrKFsgcGxlZGdlKHdhbGxldDEpIF0pXG4gICAgICAgIGJsb2NrLnJlY2VpcHRzWzBdLnJlc3VsdC5leHBlY3RFcnIoKS5leHBlY3RVaW50KDEwNSlcbiAgICB9LFxufSk7XG5cbkNsYXJpbmV0LnRlc3Qoe1xuICAgIG5hbWU6IFwicGxlZGdlOiBhIHVzZXIgc2hvdWxkIG5vdCBiZSBhYmxlIHRvIGludmVzdCBpbiBhIGNhbXBhaWduIHRoYXQgaGFzIG5vdCBzdGFydGVkXCIsXG4gICAgYXN5bmMgZm4oY2hhaW46IENoYWluLCBhY2NvdW50czogTWFwPHN0cmluZywgQWNjb3VudD4pIHtcbiAgICAgICAgY29uc3QgZGVwbG95ZXIgPSBhY2NvdW50cy5nZXQoXCJkZXBsb3llclwiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCB3YWxsZXQxID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzFcIikhLmFkZHJlc3NcblxuICAgICAgICBjaGFpbi5taW5lQmxvY2soWyBsYXVuY2god2FsbGV0MSkgXSlcbiAgICAgICAgY29uc3QgYmxvY2sgPSBjaGFpbi5taW5lQmxvY2soWyBwbGVkZ2Uod2FsbGV0MSkgXSlcbiAgICAgICAgYmxvY2sucmVjZWlwdHNbMF0ucmVzdWx0LmV4cGVjdEVycigpLmV4cGVjdFVpbnQoMTA4KVxuICAgIH0sXG59KTtcblxuQ2xhcmluZXQudGVzdCh7XG4gICAgbmFtZTogXCJwbGVkZ2U6IGEgdXNlciBzaG91bGQgbm90IGJlIGFibGUgdG8gaW52ZXN0IGluIGEgY2FtcGFpZ24gdGhhdCBoYXMgZW5kZWRcIixcbiAgICBhc3luYyBmbihjaGFpbjogQ2hhaW4sIGFjY291bnRzOiBNYXA8c3RyaW5nLCBBY2NvdW50Pikge1xuICAgICAgICBjb25zdCBkZXBsb3llciA9IGFjY291bnRzLmdldChcImRlcGxveWVyXCIpIS5hZGRyZXNzXG4gICAgICAgIGNvbnN0IHdhbGxldDEgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfMVwiKSEuYWRkcmVzc1xuXG4gICAgICAgIGNoYWluLm1pbmVCbG9jayhbIGxhdW5jaCh3YWxsZXQxKSBdKVxuICAgICAgICBjaGFpbi5taW5lRW1wdHlCbG9ja1VudGlsKDYwKVxuICAgICAgICBjb25zdCBibG9jayA9IGNoYWluLm1pbmVCbG9jayhbIHBsZWRnZSh3YWxsZXQxKSBdKVxuICAgICAgICBibG9jay5yZWNlaXB0c1swXS5yZXN1bHQuZXhwZWN0RXJyKCkuZXhwZWN0VWludCgxMDkpXG4gICAgfSxcbn0pO1xuXG5DbGFyaW5ldC50ZXN0KHtcbiAgICBuYW1lOiBcInBsZWRnZTogYSB1c2VyIHNob3VsZCBub3QgYmUgYWJsZSB0byBwbGVkZ2UgMCBTVFhcIixcbiAgICBhc3luYyBmbihjaGFpbjogQ2hhaW4sIGFjY291bnRzOiBNYXA8c3RyaW5nLCBBY2NvdW50Pikge1xuICAgICAgICBjb25zdCBkZXBsb3llciA9IGFjY291bnRzLmdldChcImRlcGxveWVyXCIpIS5hZGRyZXNzXG4gICAgICAgIGNvbnN0IHdhbGxldDEgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfMVwiKSEuYWRkcmVzc1xuXG4gICAgICAgIGNoYWluLm1pbmVCbG9jayhbIGxhdW5jaCh3YWxsZXQxKSBdKVxuICAgICAgICBjaGFpbi5taW5lRW1wdHlCbG9ja1VudGlsKDQwKVxuICAgICAgICBjb25zdCBibG9jayA9IGNoYWluLm1pbmVCbG9jayhbIHBsZWRnZUFtb3VudEVtcHR5KHdhbGxldDEpIF0pXG4gICAgICAgIGJsb2NrLnJlY2VpcHRzWzBdLnJlc3VsdC5leHBlY3RFcnIoKS5leHBlY3RVaW50KDExMClcbiAgICB9LFxufSk7XG5cbkNsYXJpbmV0LnRlc3Qoe1xuICAgIG5hbWU6IFwicGxlZGdlOiBhIHVzZXIgc2hvdWxkIG5vdCBiZSBzZW50IGFuIE5GVCB3aGVuIHBsZWRnaW5nIGxlc3MgdGhhbiA1MDAgU1RYXCIsXG4gICAgYXN5bmMgZm4oY2hhaW46IENoYWluLCBhY2NvdW50czogTWFwPHN0cmluZywgQWNjb3VudD4pIHtcbiAgICAgICAgY29uc3QgZGVwbG95ZXIgPSBhY2NvdW50cy5nZXQoXCJkZXBsb3llclwiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCB3YWxsZXQxID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzFcIikhLmFkZHJlc3NcbiAgICAgICAgY29uc3Qgd2FsbGV0MiA9IGFjY291bnRzLmdldChcIndhbGxldF8yXCIpIS5hZGRyZXNzXG5cbiAgICAgICAgY2hhaW4ubWluZUJsb2NrKFsgbGF1bmNoKHdhbGxldDEpIF0pXG4gICAgICAgIGNoYWluLm1pbmVFbXB0eUJsb2NrVW50aWwoNDApXG4gICAgICAgIGNoYWluLm1pbmVCbG9jayhbIHBsZWRnZUFtb3VudExlc3NUaGFuNTAwKHdhbGxldDIpIF0pXG5cbiAgICAgICAgY29uc3QgYXNzZXRzTWFwcyA9IGNoYWluLmdldEFzc2V0c01hcHMoKVxuICAgICAgICBjb25zdCBuZnRSZWNlaXZlZCA9IGFzc2V0c01hcHMuYXNzZXRzW1wiLmRvbm9ycGFzcy5kb25vcnBhc3NcIl1cbiAgICAgICAgYXNzZXJ0RXF1YWxzKG5mdFJlY2VpdmVkLCB1bmRlZmluZWQpXG4gICAgfSxcbn0pO1xuXG5DbGFyaW5ldC50ZXN0KHtcbiAgICBuYW1lOiBcInBsZWRnZTogYSB1c2VyIHNob3VsZCBiZSBzZW50IGFuIE5GVCB3aGVuIHBsZWRnaW5nIG1vcmUgdGhhbiA1MDAgU1RYXCIsXG4gICAgYXN5bmMgZm4oY2hhaW46IENoYWluLCBhY2NvdW50czogTWFwPHN0cmluZywgQWNjb3VudD4pIHtcbiAgICAgICAgY29uc3QgZGVwbG95ZXIgPSBhY2NvdW50cy5nZXQoXCJkZXBsb3llclwiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCB3YWxsZXQxID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzFcIikhLmFkZHJlc3NcbiAgICAgICAgY29uc3Qgd2FsbGV0MiA9IGFjY291bnRzLmdldChcIndhbGxldF8yXCIpIS5hZGRyZXNzXG5cbiAgICAgICAgY2hhaW4ubWluZUJsb2NrKFsgbGF1bmNoKHdhbGxldDEpIF0pXG4gICAgICAgIGNoYWluLm1pbmVFbXB0eUJsb2NrVW50aWwoNDApXG4gICAgICAgIGNoYWluLm1pbmVCbG9jayhbIHBsZWRnZSh3YWxsZXQyKSBdKVxuXG4gICAgICAgIGNvbnN0IGFzc2V0c01hcHMgPSBjaGFpbi5nZXRBc3NldHNNYXBzKClcbiAgICAgICAgY29uc3QgbmZ0UmVjZWl2ZWRCeUludmVzdG9yID0gYXNzZXRzTWFwcy5hc3NldHNbXCIuZG9ub3JwYXNzLmRvbm9ycGFzc1wiXVt3YWxsZXQyXVxuICAgICAgICBhc3NlcnRFcXVhbHMobmZ0UmVjZWl2ZWRCeUludmVzdG9yLCAxKVxuICAgIH0sXG59KTtcblxuLy8gVU5QTEVER0lORyBGUk9NIEEgQ0FNUEFJR05cbkNsYXJpbmV0LnRlc3Qoe1xuICAgIG5hbWU6IFwidW5wbGVkZ2U6IGEgdXNlciBzaG91bGQgYmUgYWJsZSB0byB1bnBsZWRnZSB0aGVpciBpbnZlc3RtZW50XCIsXG4gICAgYXN5bmMgZm4oY2hhaW46IENoYWluLCBhY2NvdW50czogTWFwPHN0cmluZywgQWNjb3VudD4pIHtcbiAgICAgICAgY29uc3QgZGVwbG95ZXIgPSBhY2NvdW50cy5nZXQoXCJkZXBsb3llclwiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCB3YWxsZXQxID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzFcIikhLmFkZHJlc3NcbiAgICAgICAgY29uc3Qgd2FsbGV0MiA9IGFjY291bnRzLmdldChcIndhbGxldF8yXCIpIS5hZGRyZXNzXG5cbiAgICAgICAgY2hhaW4ubWluZUJsb2NrKFsgbGF1bmNoKHdhbGxldDEpIF0pXG4gICAgICAgIGNoYWluLm1pbmVFbXB0eUJsb2NrVW50aWwoNDApXG4gICAgICAgIGNvbnN0IGJsb2NrID0gY2hhaW4ubWluZUJsb2NrKFsgcGxlZGdlKHdhbGxldDIpLCB1bnBsZWRnZSh3YWxsZXQyKSBdKVxuICAgICAgICBibG9jay5yZWNlaXB0c1sxXS5yZXN1bHQuZXhwZWN0T2soKS5leHBlY3RCb29sKHRydWUpXG4gICAgfSxcbn0pO1xuXG5DbGFyaW5ldC50ZXN0KHtcbiAgICBuYW1lOiBcInVucGxlZGdlOiB0aGUgdW5wbGVkZ2UgYW1vdW50IGlzIGRlZHVjdGVkIGZyb20gY2xlYXJmdW5kIGNvbnRyYWN0IG9uIHN1Y2Nlc3NmdWwgdW5wbGVkZ2VcIixcbiAgICBhc3luYyBmbihjaGFpbjogQ2hhaW4sIGFjY291bnRzOiBNYXA8c3RyaW5nLCBBY2NvdW50Pikge1xuICAgICAgICBjb25zdCBkZXBsb3llciA9IGFjY291bnRzLmdldChcImRlcGxveWVyXCIpIS5hZGRyZXNzXG4gICAgICAgIGNvbnN0IHdhbGxldDEgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfMVwiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCB3YWxsZXQyID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzJcIikhLmFkZHJlc3NcblxuICAgICAgICBjaGFpbi5taW5lQmxvY2soWyBsYXVuY2god2FsbGV0MSkgXSlcbiAgICAgICAgY2hhaW4ubWluZUVtcHR5QmxvY2tVbnRpbCg0MClcbiAgICAgICAgY2hhaW4ubWluZUJsb2NrKFsgcGxlZGdlKHdhbGxldDIpLCB1bnBsZWRnZSh3YWxsZXQyKSBdKVxuXG4gICAgICAgIGNvbnN0IGFzc2V0c01hcHMgPSBjaGFpbi5nZXRBc3NldHNNYXBzKClcbiAgICAgICAgY29uc3Qgc3R4RnVuZHNUcmFuc2ZlcnJlZFRvQ2xlYXJmdW5kID0gYXNzZXRzTWFwcy5hc3NldHNbXCJTVFhcIl1bYCR7ZGVwbG95ZXJ9LmNsZWFyZnVuZGBdXG4gICAgICAgIGFzc2VydEVxdWFscyhzdHhGdW5kc1RyYW5zZmVycmVkVG9DbGVhcmZ1bmQsIDUwMClcbiAgICB9LFxufSk7XG5cbkNsYXJpbmV0LnRlc3Qoe1xuICAgIG5hbWU6IFwidW5wbGVkZ2U6IHRoZSBhbW91bnQgcGxlZGdlZCBzaG91bGQgZGVjcmVtZW50IGJ5IHRoZSBzYW1lIGFtb3VudCBhIHVzZXIgdW5wbGVkZ2VkXCIsXG4gICAgYXN5bmMgZm4oY2hhaW46IENoYWluLCBhY2NvdW50czogTWFwPHN0cmluZywgQWNjb3VudD4pIHtcbiAgICAgICAgY29uc3QgZGVwbG95ZXIgPSBhY2NvdW50cy5nZXQoXCJkZXBsb3llclwiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCB3YWxsZXQxID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzFcIikhLmFkZHJlc3NcbiAgICAgICAgY29uc3Qgd2FsbGV0MiA9IGFjY291bnRzLmdldChcIndhbGxldF8yXCIpIS5hZGRyZXNzXG5cbiAgICAgICAgY2hhaW4ubWluZUJsb2NrKFsgbGF1bmNoKHdhbGxldDEpIF0pXG4gICAgICAgIGNoYWluLm1pbmVFbXB0eUJsb2NrVW50aWwoNDApXG4gICAgICAgIGNvbnN0IGJsb2NrID0gY2hhaW4ubWluZUJsb2NrKFsgcGxlZGdlKHdhbGxldDIpLCB1bnBsZWRnZSh3YWxsZXQyKSBdKVxuXG4gICAgICAgIGNvbnN0IGFzc2V0c01hcHMgPSBjaGFpbi5nZXRBc3NldHNNYXBzKClcbiAgICAgICAgY29uc3Qgc3R4QW1vdW50QWZ0ZXJVbnBsZWRnZSA9IGFzc2V0c01hcHMuYXNzZXRzW1wiU1RYXCJdW2Ake2RlcGxveWVyfS5jbGVhcmZ1bmRgXVxuICAgICAgICBhc3NlcnRFcXVhbHMoc3R4QW1vdW50QWZ0ZXJVbnBsZWRnZSwgNTAwKVxuXG4gICAgICAgIGNvbnN0IGNhbXBhaWduID0gZ2V0Q2FtcGFpZ24oY2hhaW4sIGRlcGxveWVyKVxuICAgICAgICBjYW1wYWlnbi5yZXN1bHQuZXhwZWN0T2soKS5leHBlY3RUdXBsZSgpXG4gICAgICAgIGFzc2VydFN0cmluZ0luY2x1ZGVzKGNhbXBhaWduLnJlc3VsdCwgXCJwbGVkZ2VkQW1vdW50OiB1NTAwXCIpXG4gICAgfSxcbn0pO1xuXG5DbGFyaW5ldC50ZXN0KHtcbiAgICBuYW1lOiBcInVucGxlZGdlOiB0aGUgcGxlZGdlZENvdW50IHNob3VsZCBkZWNyZW1lbnQgaWYgYSB1c2VyIHVucGxlZGdlcyB0aGVpciBlbnRpcmUgaW52ZXN0bWVudCBhbW91bnRcIixcbiAgICBhc3luYyBmbihjaGFpbjogQ2hhaW4sIGFjY291bnRzOiBNYXA8c3RyaW5nLCBBY2NvdW50Pikge1xuICAgICAgICBjb25zdCBkZXBsb3llciA9IGFjY291bnRzLmdldChcImRlcGxveWVyXCIpIS5hZGRyZXNzXG4gICAgICAgIGNvbnN0IHdhbGxldDEgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfMVwiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCB3YWxsZXQyID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzJcIikhLmFkZHJlc3NcblxuICAgICAgICBjaGFpbi5taW5lQmxvY2soWyBsYXVuY2god2FsbGV0MSkgXSlcbiAgICAgICAgY2hhaW4ubWluZUVtcHR5QmxvY2tVbnRpbCg0MClcbiAgICAgICAgY29uc3QgYmxvY2sgPSBjaGFpbi5taW5lQmxvY2soWyBwbGVkZ2Uod2FsbGV0MiksIHVucGxlZGdlQWxsKHdhbGxldDIpIF0pXG4gICAgICAgIGJsb2NrLnJlY2VpcHRzWzFdLnJlc3VsdC5leHBlY3RPaygpXG5cbiAgICAgICAgY29uc3QgY2FtcGFpZ24gPSBnZXRDYW1wYWlnbihjaGFpbiwgZGVwbG95ZXIpXG4gICAgICAgIGNhbXBhaWduLnJlc3VsdC5leHBlY3RPaygpLmV4cGVjdFR1cGxlKClcbiAgICAgICAgYXNzZXJ0U3RyaW5nSW5jbHVkZXMoY2FtcGFpZ24ucmVzdWx0LCBcInBsZWRnZWRDb3VudDogdTBcIilcbiAgICB9LFxufSk7XG5cbkNsYXJpbmV0LnRlc3Qoe1xuICAgIG5hbWU6IFwidW5wbGVkZ2U6IHRoZSBwbGVkZ2VkQ291bnQgc2hvdWxkIG5vdCBkZWNyZW1lbnQgaWYgYSB1c2VyIHVucGxlZGdlcyBzb21lIG9mIHRoZWlyIGludmVzdG1lbnQgYW1vdW50XCIsXG4gICAgYXN5bmMgZm4oY2hhaW46IENoYWluLCBhY2NvdW50czogTWFwPHN0cmluZywgQWNjb3VudD4pIHtcbiAgICAgICAgY29uc3QgZGVwbG95ZXIgPSBhY2NvdW50cy5nZXQoXCJkZXBsb3llclwiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCB3YWxsZXQxID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzFcIikhLmFkZHJlc3NcbiAgICAgICAgY29uc3Qgd2FsbGV0MiA9IGFjY291bnRzLmdldChcIndhbGxldF8yXCIpIS5hZGRyZXNzXG5cbiAgICAgICAgY2hhaW4ubWluZUJsb2NrKFsgbGF1bmNoKHdhbGxldDEpIF0pXG4gICAgICAgIGNoYWluLm1pbmVFbXB0eUJsb2NrVW50aWwoNDApXG4gICAgICAgIGNvbnN0IGJsb2NrID0gY2hhaW4ubWluZUJsb2NrKFsgcGxlZGdlKHdhbGxldDIpLCB1bnBsZWRnZSh3YWxsZXQyKSBdKVxuICAgICAgICBibG9jay5yZWNlaXB0c1sxXS5yZXN1bHQuZXhwZWN0T2soKVxuXG4gICAgICAgIGNvbnN0IGNhbXBhaWduID0gZ2V0Q2FtcGFpZ24oY2hhaW4sIGRlcGxveWVyKVxuICAgICAgICBjYW1wYWlnbi5yZXN1bHQuZXhwZWN0T2soKS5leHBlY3RUdXBsZSgpXG4gICAgICAgIGFzc2VydFN0cmluZ0luY2x1ZGVzKGNhbXBhaWduLnJlc3VsdCwgXCJwbGVkZ2VkQ291bnQ6IHUxXCIpXG4gICAgfSxcbn0pO1xuXG5DbGFyaW5ldC50ZXN0KHtcbiAgICBuYW1lOiBcInVucGxlZGdlOiBhIHVzZXIgc2hvdWxkIG5vdCBiZSBhYmxlIHRvIHVucGxlZGdlIGlmIHRoZSBjYW1wYWlnbiBoYXMgZW5kZWRcIixcbiAgICBhc3luYyBmbihjaGFpbjogQ2hhaW4sIGFjY291bnRzOiBNYXA8c3RyaW5nLCBBY2NvdW50Pikge1xuICAgICAgICBjb25zdCBkZXBsb3llciA9IGFjY291bnRzLmdldChcImRlcGxveWVyXCIpIS5hZGRyZXNzXG4gICAgICAgIGNvbnN0IHdhbGxldDEgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfMVwiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCB3YWxsZXQyID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzJcIikhLmFkZHJlc3NcblxuICAgICAgICBjaGFpbi5taW5lQmxvY2soWyBsYXVuY2god2FsbGV0MSkgXSlcbiAgICAgICAgY2hhaW4ubWluZUVtcHR5QmxvY2tVbnRpbCg2MClcbiAgICAgICAgY29uc3QgYmxvY2sgPSBjaGFpbi5taW5lQmxvY2soWyBwbGVkZ2Uod2FsbGV0MiksIHVucGxlZGdlKHdhbGxldDIpIF0pXG4gICAgICAgIGJsb2NrLnJlY2VpcHRzWzBdLnJlc3VsdC5leHBlY3RFcnIoKS5leHBlY3RVaW50KDEwOSlcbiAgICB9LFxufSk7XG5cbkNsYXJpbmV0LnRlc3Qoe1xuICAgIG5hbWU6IFwidW5wbGVkZ2U6IGEgdXNlciBzaG91bGQgbm90IGJlIGFibGUgdG8gdW5wbGVkZ2UgbW9yZSB0aGFuIHRoZXkgaGF2ZSBwbGVkZ2VkXCIsXG4gICAgYXN5bmMgZm4oY2hhaW46IENoYWluLCBhY2NvdW50czogTWFwPHN0cmluZywgQWNjb3VudD4pIHtcbiAgICAgICAgY29uc3QgZGVwbG95ZXIgPSBhY2NvdW50cy5nZXQoXCJkZXBsb3llclwiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCB3YWxsZXQxID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzFcIikhLmFkZHJlc3NcbiAgICAgICAgY29uc3Qgd2FsbGV0MiA9IGFjY291bnRzLmdldChcIndhbGxldF8yXCIpIS5hZGRyZXNzXG5cbiAgICAgICAgY2hhaW4ubWluZUJsb2NrKFsgbGF1bmNoKHdhbGxldDEpIF0pXG4gICAgICAgIGNoYWluLm1pbmVFbXB0eUJsb2NrVW50aWwoNDApXG4gICAgICAgIGNvbnN0IGJsb2NrID0gY2hhaW4ubWluZUJsb2NrKFsgcGxlZGdlKHdhbGxldDIpLCB1bnBsZWRnZU1vcmVUaGFuUGxlZGdlZCh3YWxsZXQyKSBdKVxuXG4gICAgICAgIGJsb2NrLnJlY2VpcHRzWzFdLnJlc3VsdC5leHBlY3RFcnIoKS5leHBlY3RVaW50KDExMylcbiAgICAgICAgYXNzZXJ0RXF1YWxzKGJsb2NrLnJlY2VpcHRzWzFdLmV2ZW50cy5sZW5ndGgsIDApXG4gICAgfSxcbn0pO1xuXG5DbGFyaW5ldC50ZXN0KHtcbiAgICBuYW1lOiBcInVucGxlZGdlOiBhIHVzZXIgc2hvdWxkIG5vdCBiZSBhYmxlIHRvIHVucGxlZGdlIHNvbWVvbmUgZWxzZSdzIGludmVzdG1lbnRcIixcbiAgICBhc3luYyBmbihjaGFpbjogQ2hhaW4sIGFjY291bnRzOiBNYXA8c3RyaW5nLCBBY2NvdW50Pikge1xuICAgICAgICBjb25zdCBkZXBsb3llciA9IGFjY291bnRzLmdldChcImRlcGxveWVyXCIpIS5hZGRyZXNzXG4gICAgICAgIGNvbnN0IHdhbGxldDEgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfMVwiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCB3YWxsZXQyID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzJcIikhLmFkZHJlc3NcbiAgICAgICAgY29uc3Qgd2FsbGV0MyA9IGFjY291bnRzLmdldChcIndhbGxldF8zXCIpIS5hZGRyZXNzXG5cbiAgICAgICAgY2hhaW4ubWluZUJsb2NrKFsgbGF1bmNoKHdhbGxldDEpIF0pXG4gICAgICAgIGNoYWluLm1pbmVFbXB0eUJsb2NrVW50aWwoNDApXG4gICAgICAgIGNoYWluLm1pbmVCbG9jayhbIHBsZWRnZSh3YWxsZXQyKSBdKVxuXG4gICAgICAgIGNvbnN0IGFzc2V0c01hcHMgPSBjaGFpbi5nZXRBc3NldHNNYXBzKClcbiAgICAgICAgY29uc3Qgc3R4RnVuZHNUcmFuc2ZlcnJlZFRvQ2xlYXJmdW5kID0gYXNzZXRzTWFwcy5hc3NldHNbXCJTVFhcIl1bYCR7ZGVwbG95ZXJ9LmNsZWFyZnVuZGBdXG4gICAgICAgIGFzc2VydEVxdWFscyhzdHhGdW5kc1RyYW5zZmVycmVkVG9DbGVhcmZ1bmQsIDEwMDApXG5cbiAgICAgICAgY29uc3QgYmxvY2sgPSBjaGFpbi5taW5lQmxvY2soWyB1bnBsZWRnZSh3YWxsZXQzKSBdKVxuXG4gICAgICAgIGNvbnN0IGFzc2V0c01hcHMyID0gY2hhaW4uZ2V0QXNzZXRzTWFwcygpXG4gICAgICAgIGNvbnN0IHN0eEZ1bmRzVHJhbnNmZXJyZWRUb0NsZWFyZnVuZDIgPSBhc3NldHNNYXBzMi5hc3NldHNbXCJTVFhcIl1bYCR7ZGVwbG95ZXJ9LmNsZWFyZnVuZGBdXG4gICAgICAgIGFzc2VydEVxdWFscyhzdHhGdW5kc1RyYW5zZmVycmVkVG9DbGVhcmZ1bmQyLCAxMDAwKVxuXG4gICAgICAgIGJsb2NrLnJlY2VpcHRzWzBdLnJlc3VsdC5leHBlY3RFcnIoKS5leHBlY3RVaW50KDExMilcbiAgICB9LFxufSk7XG5cbi8vIFJFRlVORCBGUk9NIEEgQ0FNUEFJR05cbkNsYXJpbmV0LnRlc3Qoe1xuICAgIG5hbWU6IFwicmVmdW5kOiBhIHVzZXIgY2FuIGdldCByZWZ1bmQgZnJvbSB0aGUgY2FtcGFpZ24gdGhhdCBoYXMgZW5kZWQgYW5kIG5vdCByZWFjaGVkIGl0cyBnb2FsXCIsXG4gICAgYXN5bmMgZm4oY2hhaW46IENoYWluLCBhY2NvdW50czogTWFwPHN0cmluZywgQWNjb3VudD4pIHtcbiAgICAgICAgY29uc3QgZGVwbG95ZXIgPSBhY2NvdW50cy5nZXQoXCJkZXBsb3llclwiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCB3YWxsZXQxID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzFcIikhLmFkZHJlc3NcbiAgICAgICAgY29uc3Qgd2FsbGV0MiA9IGFjY291bnRzLmdldChcIndhbGxldF8yXCIpIS5hZGRyZXNzXG5cbiAgICAgICAgY2hhaW4ubWluZUJsb2NrKFsgbGF1bmNoKHdhbGxldDEpIF0pXG4gICAgICAgIGNoYWluLm1pbmVFbXB0eUJsb2NrVW50aWwoMjApXG4gICAgICAgIGNoYWluLm1pbmVCbG9jayhbIHBsZWRnZSh3YWxsZXQyKSBdKVxuICAgICAgICBjaGFpbi5taW5lRW1wdHlCbG9ja1VudGlsKDYwKVxuXG4gICAgICAgIGNvbnN0IGJsb2NrID0gY2hhaW4ubWluZUJsb2NrKFsgcmVmdW5kKHdhbGxldDIpIF0pXG4gICAgICAgIGJsb2NrLnJlY2VpcHRzWzBdLnJlc3VsdC5leHBlY3RPaygpLmV4cGVjdEJvb2wodHJ1ZSlcbiAgICB9LFxufSk7XG5cbkNsYXJpbmV0LnRlc3Qoe1xuICAgIG5hbWU6IFwicmVmdW5kOiB0aGUgdG90YWwgYW1vdW50IHBsZWRnZWQgaXMgcmVmdW5kZWQgdG8gdGhlIGludmVzdG9yIGZyb20gdGhlIGNhbXBhaWduIG9uIHN1Y2Nlc3NmdWwgcmVmdW5kXCIsXG4gICAgYXN5bmMgZm4oY2hhaW46IENoYWluLCBhY2NvdW50czogTWFwPHN0cmluZywgQWNjb3VudD4pIHtcbiAgICAgICAgY29uc3QgZGVwbG95ZXIgPSBhY2NvdW50cy5nZXQoXCJkZXBsb3llclwiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCB3YWxsZXQxID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzFcIikhLmFkZHJlc3NcbiAgICAgICAgY29uc3Qgd2FsbGV0MiA9IGFjY291bnRzLmdldChcIndhbGxldF8yXCIpIS5hZGRyZXNzXG5cbiAgICAgICAgY2hhaW4ubWluZUJsb2NrKFsgbGF1bmNoKHdhbGxldDEpIF0pXG4gICAgICAgIGNoYWluLm1pbmVFbXB0eUJsb2NrVW50aWwoMjApXG4gICAgICAgIGNoYWluLm1pbmVCbG9jayhbIHBsZWRnZSh3YWxsZXQyKSBdKVxuICAgICAgICBjaGFpbi5taW5lRW1wdHlCbG9ja1VudGlsKDYwKVxuXG4gICAgICAgIGNvbnN0IGFzc2V0c01hcHMgPSBjaGFpbi5nZXRBc3NldHNNYXBzKClcbiAgICAgICAgY29uc3Qgc3R4RnVuZHNDbGVhcmZ1bmRBZnRlclBsZWRnZSA9IGFzc2V0c01hcHMuYXNzZXRzW1wiU1RYXCJdW2Ake2RlcGxveWVyfS5jbGVhcmZ1bmRgXVxuICAgICAgICBjb25zdCBzdHhGdW5kc1dhbGxldDJBZnRlclBsZWRnZSA9IGFzc2V0c01hcHMuYXNzZXRzW1wiU1RYXCJdW3dhbGxldDJdXG5cbiAgICAgICAgY2hhaW4ubWluZUJsb2NrKFsgcmVmdW5kKHdhbGxldDIpIF0pXG5cbiAgICAgICAgY29uc3QgYXNzZXRzTWFwczIgPSBjaGFpbi5nZXRBc3NldHNNYXBzKClcbiAgICAgICAgY29uc3Qgc3R4RnVuZHNXYWxsZXQyQWZ0ZXJSZWZ1bmQgPSBhc3NldHNNYXBzMi5hc3NldHNbXCJTVFhcIl1bd2FsbGV0Ml1cbiAgICAgICAgYXNzZXJ0RXF1YWxzKHN0eEZ1bmRzV2FsbGV0MkFmdGVyUmVmdW5kLCBzdHhGdW5kc1dhbGxldDJBZnRlclBsZWRnZSArIHN0eEZ1bmRzQ2xlYXJmdW5kQWZ0ZXJQbGVkZ2UpXG4gICAgfSxcbn0pO1xuXG5DbGFyaW5ldC50ZXN0KHtcbiAgICBuYW1lOiBcInJlZnVuZDogdGhlIGludmVzdG1lbnQgcmVjb3JkIGlzIGRlbGV0ZWQgZnJvbSB0aGUgaW52ZXN0bWVudCBtYXAgb24gc3VjY2Vzc2Z1bCByZWZ1bmQgdG8gdGhlIHVzZXJcIixcbiAgICBhc3luYyBmbihjaGFpbjogQ2hhaW4sIGFjY291bnRzOiBNYXA8c3RyaW5nLCBBY2NvdW50Pikge1xuICAgICAgICBjb25zdCBkZXBsb3llciA9IGFjY291bnRzLmdldChcImRlcGxveWVyXCIpIS5hZGRyZXNzXG4gICAgICAgIGNvbnN0IHdhbGxldDEgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfMVwiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCB3YWxsZXQyID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzJcIikhLmFkZHJlc3NcblxuICAgICAgICBjaGFpbi5taW5lQmxvY2soWyBsYXVuY2god2FsbGV0MSkgXSlcbiAgICAgICAgY2hhaW4ubWluZUVtcHR5QmxvY2tVbnRpbCgyMClcbiAgICAgICAgY2hhaW4ubWluZUJsb2NrKFsgcGxlZGdlKHdhbGxldDIpIF0pXG4gICAgICAgIGNoYWluLm1pbmVFbXB0eUJsb2NrVW50aWwoNjApXG5cbiAgICAgICAgY2hhaW4ubWluZUJsb2NrKFsgcmVmdW5kKHdhbGxldDIpIF0pXG5cbiAgICAgICAgY29uc3QgaW52ZXN0bWVudCA9IGdldEludmVzdG1lbnQoY2hhaW4sIGRlcGxveWVyKVxuICAgICAgICBpbnZlc3RtZW50LnJlc3VsdC5leHBlY3RPaygpLmV4cGVjdE5vbmUoKVxuICAgIH0sXG59KTtcblxuQ2xhcmluZXQudGVzdCh7XG4gICAgbmFtZTogXCJyZWZ1bmQ6IGEgdXNlciBjYW5ub3QgZ2V0IHJlZnVuZCBmcm9tIGEgY2FtcGFpZ24gdGhhdCBkb2VzIG5vdCBleGlzdFwiLFxuICAgIGFzeW5jIGZuKGNoYWluOiBDaGFpbiwgYWNjb3VudHM6IE1hcDxzdHJpbmcsIEFjY291bnQ+KSB7XG4gICAgICAgIGNvbnN0IGRlcGxveWVyID0gYWNjb3VudHMuZ2V0KFwiZGVwbG95ZXJcIikhLmFkZHJlc3NcbiAgICAgICAgY29uc3Qgd2FsbGV0MSA9IGFjY291bnRzLmdldChcIndhbGxldF8xXCIpIS5hZGRyZXNzXG4gICAgICAgIGNvbnN0IHdhbGxldDIgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfMlwiKSEuYWRkcmVzc1xuXG4gICAgICAgIGNvbnN0IGJsb2NrID0gY2hhaW4ubWluZUJsb2NrKFsgcmVmdW5kKHdhbGxldDIpIF0pXG4gICAgICAgIGJsb2NrLnJlY2VpcHRzWzBdLnJlc3VsdC5leHBlY3RFcnIoKS5leHBlY3RVaW50KDEwNSlcbiAgICB9LFxufSk7XG5cbkNsYXJpbmV0LnRlc3Qoe1xuICAgIG5hbWU6IFwicmVmdW5kOiBhIHVzZXIgY2Fubm90IGdldCByZWZ1bmQgZnJvbSBhIGNhbXBhaWduIHdoZXJlIHRoZSB1c2VyIGRpZCBub3QgbWFrZSBhbnkgcGxlZGdlc1wiLFxuICAgIGFzeW5jIGZuKGNoYWluOiBDaGFpbiwgYWNjb3VudHM6IE1hcDxzdHJpbmcsIEFjY291bnQ+KSB7XG4gICAgICAgIGNvbnN0IGRlcGxveWVyID0gYWNjb3VudHMuZ2V0KFwiZGVwbG95ZXJcIikhLmFkZHJlc3NcbiAgICAgICAgY29uc3Qgd2FsbGV0MSA9IGFjY291bnRzLmdldChcIndhbGxldF8xXCIpIS5hZGRyZXNzXG4gICAgICAgIGNvbnN0IHdhbGxldDIgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfMlwiKSEuYWRkcmVzc1xuXG4gICAgICAgIGNoYWluLm1pbmVCbG9jayhbIGxhdW5jaCh3YWxsZXQxKSBdKVxuICAgICAgICBjaGFpbi5taW5lRW1wdHlCbG9ja1VudGlsKDQwKVxuXG4gICAgICAgIGNvbnN0IGJsb2NrID0gY2hhaW4ubWluZUJsb2NrKFsgcmVmdW5kKHdhbGxldDIpIF0pXG5cbiAgICAgICAgYmxvY2sucmVjZWlwdHNbMF0ucmVzdWx0LmV4cGVjdEVycigpLmV4cGVjdFVpbnQoMTEyKVxuICAgIH0sXG59KTtcblxuQ2xhcmluZXQudGVzdCh7XG4gICAgbmFtZTogXCJyZWZ1bmQ6IGEgdXNlciBjYW5ub3QgZ2V0IHJlZnVuZCBmcm9tIGEgY2FtcGFpZ24gdGhhdCBpcyBzdGlsbCBhY3RpdmVcIixcbiAgICBhc3luYyBmbihjaGFpbjogQ2hhaW4sIGFjY291bnRzOiBNYXA8c3RyaW5nLCBBY2NvdW50Pikge1xuICAgICAgICBjb25zdCBkZXBsb3llciA9IGFjY291bnRzLmdldChcImRlcGxveWVyXCIpIS5hZGRyZXNzXG4gICAgICAgIGNvbnN0IHdhbGxldDEgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfMVwiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCB3YWxsZXQyID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzJcIikhLmFkZHJlc3NcblxuICAgICAgICBjaGFpbi5taW5lQmxvY2soWyBsYXVuY2god2FsbGV0MSkgXSlcbiAgICAgICAgY2hhaW4ubWluZUVtcHR5QmxvY2tVbnRpbCg0MClcbiAgICAgICAgY2hhaW4ubWluZUJsb2NrKFsgcGxlZGdlKHdhbGxldDIpIF0pXG5cbiAgICAgICAgY29uc3QgYmxvY2sgPSBjaGFpbi5taW5lQmxvY2soWyByZWZ1bmQod2FsbGV0MikgXSlcbiAgICAgICAgYmxvY2sucmVjZWlwdHNbMF0ucmVzdWx0LmV4cGVjdEVycigpLmV4cGVjdFVpbnQoMTE0KVxuICAgIH0sXG59KTtcblxuQ2xhcmluZXQudGVzdCh7XG4gICAgbmFtZTogXCJyZWZ1bmQ6IGEgdXNlciBjYW5ub3QgZ2V0IHJlZnVuZCBmcm9tIGEgY2FtcGFpZ24gdGhhdCBoYXMgZW5kZWQgYW5kIGhhcyByZWFjaGVkIHRoZSBnb2FsXCIsXG4gICAgYXN5bmMgZm4oY2hhaW46IENoYWluLCBhY2NvdW50czogTWFwPHN0cmluZywgQWNjb3VudD4pIHtcbiAgICAgICAgY29uc3QgZGVwbG95ZXIgPSBhY2NvdW50cy5nZXQoXCJkZXBsb3llclwiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCB3YWxsZXQxID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzFcIikhLmFkZHJlc3NcbiAgICAgICAgY29uc3Qgd2FsbGV0MiA9IGFjY291bnRzLmdldChcIndhbGxldF8yXCIpIS5hZGRyZXNzXG5cbiAgICAgICAgY2hhaW4ubWluZUJsb2NrKFsgbGF1bmNoKHdhbGxldDEpIF0pXG4gICAgICAgIGNoYWluLm1pbmVFbXB0eUJsb2NrVW50aWwoMjApXG4gICAgICAgIGNoYWluLm1pbmVCbG9jayhbIHBsZWRnZSh3YWxsZXQyKSwgcGxlZGdlQW1vdW50R3JlYXRlclRoYW5Hb2FsKHdhbGxldDIpIF0pXG4gICAgICAgIGNoYWluLm1pbmVFbXB0eUJsb2NrVW50aWwoNjApXG5cbiAgICAgICAgY29uc3QgYmxvY2sgPSBjaGFpbi5taW5lQmxvY2soWyByZWZ1bmQod2FsbGV0MikgXSlcbiAgICAgICAgYmxvY2sucmVjZWlwdHNbMF0ucmVzdWx0LmV4cGVjdEVycigpLmV4cGVjdFVpbnQoMTE1KVxuICAgIH0sXG59KTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxTQUFTLFFBQVEsRUFBRSxFQUFFLEVBQWtCLEtBQUssUUFBUSw4Q0FBOEMsQ0FBQztBQUNuRyxTQUFTLFlBQVksRUFBRSxvQkFBb0IsUUFBUSxpREFBaUQsQ0FBQztBQUNyRyxTQUNJLE1BQU0sRUFDTixNQUFNLEVBQ04saUJBQWlCLEVBQ2pCLHVCQUF1QixFQUN2QixXQUFXLEVBQ1gsUUFBUSxFQUNSLHVCQUF1QixFQUN2QixXQUFXLEVBQ1gsYUFBYSxFQUNiLE1BQU0sRUFDTiwyQkFBMkIsUUFDeEIseUJBQXlCLENBQUE7QUFFaEMsU0FBUyxLQUFLLEdBQUc7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QyxTQUFTLEVBQUUsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7UUFFbkMsSUFBSSxNQUFNLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQztZQUN6QixFQUFFLENBQUMsWUFBWSxDQUFDLFdBQVcsRUFBRSxRQUFRLEVBQUU7Z0JBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7Z0JBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQztnQkFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztnQkFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQzthQUFDLEVBQUUsUUFBUSxDQUFDO1NBQy9LLENBQUMsQUFBQztRQUNILE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxBQUFDO1FBQzFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7UUFFbkMsSUFBSSxNQUFNLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQztZQUN6QixFQUFFLENBQUMsWUFBWSxDQUFDLFdBQVcsRUFBRSxRQUFRLEVBQUU7Z0JBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7Z0JBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxpQ0FBaUMsQ0FBQztnQkFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztnQkFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQzthQUFDLEVBQUUsUUFBUSxDQUFDO1NBQzNMLENBQUMsQUFBQztRQUNILE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMs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