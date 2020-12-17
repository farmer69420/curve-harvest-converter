// This test is only invoked if MAINNET_FORK is set
if (process.env.MAINNET_FORK) {
    const Utils = require("./Utils.js");
    const MFC = require("./mainnet-fork-test-config.js");
    const { send } = require("@openzeppelin/test-helpers");
    const BigNumber = require("bignumber.js");
    //const Controller = artifacts.require("Controller");
    //const Storage = artifacts.require("Storage");
    const CurveConverterRENBTC = artifacts.require("CurveConverterRENBTC");
    const IERC20 = artifacts.require("IERC20");
    //const makeVault = require("./make-vault.js");
  
    BigNumber.config({ DECIMAL_PLACES: 8 });
  
    contract("Mainnet Curve Converter RENBTC", function (accounts) {
      describe(`Curve renWBTC`, function () {
        // external contracts
        let underlying;
        let renbtc;
        let wbtc;
  
        // external setup
        let renbtcWhale = MFC.RENBTC_WHALE_ADDRESS;
        let wbtcWhale = MFC.WBTC_WHALE_ADDRESS;


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
          underlying = await IERC20.at(MFC.RENBTC_MIXED_ADDRESS);
          vault = await IERC20.at(MFC.RENBTC_VAULT_ADDRESS);
          renbtc = await IERC20.at(MFC.RENBTC_ADDRESS);
          wbtc = await IERC20.at(MFC.WBTC_ADDRESS);
        }

        async function setupCoreProtocol() {
          converterRENBTC = await CurveConverterRENBTC.new(
            vault.address,
            underlying.address,
            MFC.RENBTC_DEPOSIT_ADDRESS,
            renbtc.address,
            wbtc.address
            );
        }

        async function setupBalance(){
          // Give whale some ether to make sure the following actions are good
          await send.ether(etherGiver, renbtcWhale, "1" + "000000000000000000");
          await send.ether(etherGiver, wbtcWhale, "1" + "000000000000000000");
          renbtcBalance = await renbtc.balanceOf(renbtcWhale);
          wbtcBalance = await wbtc.balanceOf(wbtcWhale);
  
          await renbtc.transfer(farmer1, renbtcBalance, { from: renbtcWhale });
          await wbtc.transfer(farmer1, wbtcBalance, { from: wbtcWhale });
        }

        beforeEach(async function () {
            await setupExternalContracts();
            await setupCoreProtocol();
            await setupBalance();
          });
    
        /**
        it("A farmer depositing renBTC", async function () {
          let farmerOldBalance = new BigNumber(await vault.balanceOf(farmer1));
          let renbtcBalance = new BigNumber(Math.floor(await renbtc.balanceOf(farmer1) /23));
          console.log("deposit renBTC: "+renbtcBalance);
        
          await renbtc.approve(converterRENBTC.address, renbtcBalance, { from: farmer1 });
          //await converterRENBTC.depositAll(renbtcBalance, 0, { from: farmer1 });    
          await converterRENBTC.depositAll(100000000, 0, { from: farmer1 });    
          
          let farmerNewBalance = new BigNumber(await vault.balanceOf(farmer1));
          console.log("farmer fcrvRenWBTC Balance: " + farmerNewBalance);
          Utils.assertBNGt(farmerNewBalance, farmerOldBalance);
        });
        */
        it("A farmer depositing WBTC", async function () {
          let farmerOldBalance = new BigNumber(await vault.balanceOf(farmer1));
          let wbtcBalance = new BigNumber(Math.floor(await wbtc.balanceOf(farmer1) / 23));
          console.log("deposit WBTC: "+wbtcBalance)
        
          await wbtc.approve(converterRENBTC.address, wbtcBalance, { from: farmer1 });
          await converterRENBTC.depositAll(0, wbtcBalance, { from: farmer1 });    
          
          let farmerNewBalance = new BigNumber(await vault.balanceOf(farmer1));
          console.log("farmer fcrvRenWBTC Balance: " + farmerNewBalance)
          Utils.assertBNGt(farmerNewBalance, farmerOldBalance);
        });
         
        
        it("A farmer depositing renBTC, wBTC", async function () {
          let farmerOldBalance = new BigNumber(await vault.balanceOf(farmer1));
          let renbtcBalance = new BigNumber(Math.floor(await renbtc.balanceOf(farmer1) ));
          let wbtcBalance = new BigNumber(Math.floor(await wbtc.balanceOf(farmer1) ));
          console.log("deposit renBTC: "+renbtcBalance);
          console.log("deposit WBTC: "+wbtcBalance);
        
          await renbtc.approve(converterRENBTC.address, renbtcBalance, { from: farmer1 });
          await wbtc.approve(converterRENBTC.address, wbtcBalance, { from: farmer1 });
          await converterRENBTC.depositAll(renbtcBalance, wbtcBalance, { from: farmer1 });    
 
          let farmerNewBalance = new BigNumber(await vault.balanceOf(farmer1));
          console.log("farmer fcrvRenWBTC Balance: " + farmerNewBalance)
          Utils.assertBNGt(farmerNewBalance, farmerOldBalance);
        });
        });
      });
    }
    