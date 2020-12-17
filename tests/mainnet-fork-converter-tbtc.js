// This test is only invoked if MAINNET_FORK is set
if (process.env.MAINNET_FORK) {
    const Utils = require("./Utils.js");
    const MFC = require("./mainnet-fork-test-config.js");
    const { send } = require("@openzeppelin/test-helpers");
    const BigNumber = require("bignumber.js");
    //const Controller = artifacts.require("Controller");
    //const Storage = artifacts.require("Storage");
    const CurveConverterTBTC = artifacts.require("CurveConverterTBTC");
    const IERC20 = artifacts.require("IERC20");
    //const makeVault = require("./make-vault.js");
  
    BigNumber.config({ DECIMAL_PLACES: 8 });
  
    contract("Mainnet Curve Converter TBTC", function (accounts) {
      describe(`Curve TBTC`, function () {
        // external contracts
        let underlying;
        let tbtc;
        let renbtc;
        let wbtc;
        let sbtc;
  
        // external setup
        let tbtcWhale = MFC.TBTC_WHALE_ADDRESS;
        let renbtcWhale = MFC.RENBTC_WHALE_ADDRESS;
        let wbtcWhale = MFC.WBTC_WHALE_ADDRESS;
        let sbtcWhale = MFC.SBTC_WHALE_ADDRESS;


        // parties in the protocol
        let governance = accounts[1];
        let farmer1 = accounts[3];
  
        // numbers used in tests
        let farmerBalance;
  
        // only used for ether distribution
        let etherGiver = accounts[9];
  
        // Core protocol contracts
        let vault;
  
        async function setupExternalContracts() {
          underlying = await IERC20.at(MFC.TBTC_MIXED_ADDRESS);
          vault = await IERC20.at(MFC.TBTC_VAULT_ADDRESS);
          tbtc = await IERC20.at(MFC.TBTC_ADDRESS);
          renbtc = await IERC20.at(MFC.RENBTC_ADDRESS);
          wbtc = await IERC20.at(MFC.WBTC_ADDRESS);
          sbtc = await IERC20.at(MFC.SBTC_ADDRESS);
        }

        async function setupCoreProtocol() {
          converterTBTC = await CurveConverterTBTC.new(
            vault.address,
            underlying.address,
            MFC.TBTC_DEPOSIT_ADDRESS,
            tbtc.address,
            renbtc.address,
            wbtc.address,
            sbtc.address
            );
        }

        async function setupBalance(){
          // Give whale some ether to make sure the following actions are good
          await send.ether(etherGiver, tbtcWhale, "1" + "000000000000000000");
          await send.ether(etherGiver, renbtcWhale, "1" + "000000000000000000");
          await send.ether(etherGiver, wbtcWhale, "1" + "000000000000000000");
          await send.ether(etherGiver, sbtcWhale, "1" + "000000000000000000");
          tbtcBalance = await tbtc.balanceOf(tbtcWhale);
          renbtcBalance = await renbtc.balanceOf(renbtcWhale);
          wbtcBalance = await wbtc.balanceOf(wbtcWhale);
          sbtcBalance = await sbtc.balanceOf(sbtcWhale);
  
          await tbtc.transfer(farmer1, tbtcBalance, { from: tbtcWhale });
          await renbtc.transfer(farmer1, renbtcBalance, { from: renbtcWhale });
          await wbtc.transfer(farmer1, wbtcBalance, { from: wbtcWhale });
          await sbtc.transfer(farmer1, sbtcBalance, { from: sbtcWhale });
        }

        beforeEach(async function () {
            await setupExternalContracts();
            await setupCoreProtocol();
            await setupBalance();
          });
    
         
        it("A farmer depositing TBTC", async function () {
          let farmerOldBalance = new BigNumber(await vault.balanceOf(farmer1));
          let tbtcBalance = new BigNumber(Math.floor(await tbtc.balanceOf(farmer1) /2));
          console.log("deposit TBTC: "+tbtcBalance);
        
          await tbtc.approve(converterTBTC.address, tbtcBalance, { from: farmer1 });
          await converterTBTC.depositAll([tbtcBalance, 0, 0, 0], 0, { from: farmer1 });    
          
          let farmerNewBalance = new BigNumber(await vault.balanceOf(farmer1));
          console.log("farmer fCRV-TBTC Balance: " + farmerNewBalance);
          Utils.assertBNGt(farmerNewBalance, farmerOldBalance);
        });

        it("A farmer depositing RenBTC", async function () {
          let farmerOldBalance = new BigNumber(await vault.balanceOf(farmer1));
          let renbtcBalance = new BigNumber(Math.floor(await renbtc.balanceOf(farmer1) / 2));
          console.log("deposit RenBTC: "+renbtcBalance)
        
          await renbtc.approve(converterTBTC.address, renbtcBalance, { from: farmer1 });
          await converterTBTC.depositAll([0, renbtcBalance, 0, 0], 0, { from: farmer1 });    
          
          let farmerNewBalance = new BigNumber(await vault.balanceOf(farmer1));
          console.log("farmer fCRV-TBTC Balance: " + farmerNewBalance)
          Utils.assertBNGt(farmerNewBalance, farmerOldBalance);
        });

        it("A farmer depositing WBTC", async function () {
          let farmerOldBalance = new BigNumber(await vault.balanceOf(farmer1));
          let wbtcBalance = new BigNumber(Math.floor(await wbtc.balanceOf(farmer1) / 2));
          console.log("deposit WBTC: "+wbtcBalance)
        
          await wbtc.approve(converterTBTC.address, wbtcBalance, { from: farmer1 });
          await converterTBTC.depositAll([0, 0, wbtcBalance, 0], 0, { from: farmer1 });    
          
          let farmerNewBalance = new BigNumber(await vault.balanceOf(farmer1));
          console.log("farmer fCRV-TBTC Balance: " + farmerNewBalance)
          Utils.assertBNGt(farmerNewBalance, farmerOldBalance);
        });

        it("A farmer depositing SBTC", async function () {
          let farmerOldBalance = new BigNumber(await vault.balanceOf(farmer1));
          let sbtcBalance = new BigNumber(Math.floor(await sbtc.balanceOf(farmer1) / 2));
          console.log("deposit SBTC: "+sbtcBalance)
        
          await sbtc.approve(converterTBTC.address, sbtcBalance, { from: farmer1 });
          await converterTBTC.depositAll([0, 0, 0, sbtcBalance], 0, { from: farmer1 });    
          
          let farmerNewBalance = new BigNumber(await vault.balanceOf(farmer1));
          console.log("farmer fCRV-TBTC Balance: " + farmerNewBalance)
          Utils.assertBNGt(farmerNewBalance, farmerOldBalance);
        });
        
         
        it("A farmer depositing TBTC, RenBTC, WBTC SBTC", async function () {
          let farmerOldBalance = new BigNumber(await vault.balanceOf(farmer1));
          let tbtcBalance = new BigNumber(Math.floor(await tbtc.balanceOf(farmer1) / 2));
          let renbtcBalance = new BigNumber(Math.floor(await renbtc.balanceOf(farmer1) / 2));
          let wbtcBalance = new BigNumber(Math.floor(await wbtc.balanceOf(farmer1) / 2));
          let sbtcBalance = new BigNumber(Math.floor(await sbtc.balanceOf(farmer1) / 2));
          console.log("deposit TBTC: "+tbtcBalance);
          console.log("deposit RenBTC: "+renbtcBalance);
          console.log("deposit WBTC: "+wbtcBalance);
          console.log("deposit SBTC: "+sbtcBalance);
        
          await tbtc.approve(converterTBTC.address, tbtcBalance, { from: farmer1 });
          await renbtc.approve(converterTBTC.address, renbtcBalance, { from: farmer1 });
          await wbtc.approve(converterTBTC.address, wbtcBalance, { from: farmer1 });
          await sbtc.approve(converterTBTC.address, sbtcBalance, { from: farmer1 });
          await converterTBTC.depositAll([tbtcBalance, renbtcBalance, wbtcBalance, sbtcBalance], 0, { from: farmer1 });    
          
          let farmerNewBalance = new BigNumber(await vault.balanceOf(farmer1));
          console.log("farmer fhCRV Balance: " + farmerNewBalance)
          Utils.assertBNGt(farmerNewBalance, farmerOldBalance);
        });
        
        });
      });
    }
    