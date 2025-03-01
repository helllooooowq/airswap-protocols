const { expect } = require('chai')
const { ethers, waffle } = require('hardhat')
const IERC1155 = require('@openzeppelin/contracts/build/contracts/IERC1155.json')
const { deployMockContract } = waffle
const { ADDRESS_ZERO, TokenKinds } = require('@airswap/constants')

let snapshotId
let adapter
let party

describe('ERC1155Adapter Unit', () => {
  beforeEach(async () => {
    snapshotId = await ethers.provider.send('evm_snapshot')
  })

  afterEach(async () => {
    await ethers.provider.send('evm_revert', [snapshotId])
  })

  before('deploy erc1155 transfer handler', async () => {
    ;[deployer, anyone] = await ethers.getSigners()
    token = await deployMockContract(deployer, IERC1155.abi)
    adapter = await (await ethers.getContractFactory('ERC1155Adapter')).deploy()
    await adapter.deployed()
    party = {
      wallet: ADDRESS_ZERO,
      token: token.address,
      kind: TokenKinds.ERC1155,
      id: '0',
      amount: '1',
    }
  })

  it('hasAllowance succeeds', async () => {
    await token.mock.isApprovedForAll
      .withArgs(party.wallet, anyone.address)
      .returns(true)
    expect(await adapter.connect(anyone).hasAllowance(party)).to.be.equal(true)
  })

  it('hasAllowance fails for wrong address', async () => {
    await token.mock.isApprovedForAll
      .withArgs(party.wallet, anyone.address)
      .returns(false)
    await token.mock.isApprovedForAll
      .withArgs(party.wallet, deployer.address)
      .returns(true)
    expect(await adapter.connect(anyone).hasAllowance(party)).to.be.equal(false)
  })

  it('hasBalance succeeds', async () => {
    await token.mock.balanceOf.returns(party.amount)
    expect(await adapter.hasBalance(party)).to.be.equal(true)
  })

  it('transfer succeeds', async () => {
    await token.mock.safeTransferFrom.returns()
    await expect(
      adapter
        .connect(anyone)
        .transfer(
          party.wallet,
          anyone.address,
          party.amount,
          party.id,
          party.token
        )
    ).to.not.be.reverted
  })
})
