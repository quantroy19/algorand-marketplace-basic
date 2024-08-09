// src/components/Home.tsx
import { useWallet } from '@txnlab/use-wallet'
import React, { useEffect, useState } from 'react'
import * as algokit from '@algorandfoundation/algokit-utils'
import ConnectWallet from './components/ConnectWallet'
import Transact from './components/Transact'
import AppCalls from './components/AppCalls'
import * as methods from './method'
import MethodCall from './components/methodCall'
import { getAlgodConfigFromViteEnvironment } from './utils/network/getAlgoClientConfigs'
import { MarketplaceClient } from './contracts/Marketplace'
import algosdk from 'algosdk'

interface HomeProps {}
algokit.Config.configure({ populateAppCallResources: true })

const Home: React.FC<HomeProps> = () => {
  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false)
  const [openDemoModal, setOpenDemoModal] = useState<boolean>(false)
  const [appCallsDemoModal, setAppCallsDemoModal] = useState<boolean>(false)
  const [appId, setAppId] = useState<number>(0)
  const [unitaryPrice, setUnitaryPrice] = useState<bigint>(0n)
  const [assetId, setAssetId] = useState<bigint>(0n)
  const [quantity, setQuantity] = useState<bigint>(0n)
  const [seller, setSeller] = useState<string>('')
  const [unitsLeft, setUnitsLeft] = useState<bigint>(0n)
  const { activeAddress, signer } = useWallet()

  useEffect(() => {
    dmClient.getGlobalState().then((globalState) => {
      setUnitaryPrice(globalState.unitaryPrice?.asBigInt() || 0n)
      const id = globalState.assetId?.asBigInt() || 0n
      setAssetId(id)

      // appID -> Address
      algorand.account.getAssetInformation(algosdk.getApplicationAddress(appId), id).then((info) => {
        setUnitsLeft(info.balance)
      })

      algorand.client.algod
        .getApplicationByID(appId)
        .do()
        .then((res) => {
          setSeller(res.params.creator)
        })
    })
  }, [appId])
  const toggleWalletModal = () => {
    setOpenWalletModal(!openWalletModal)
  }

  const algodConfig = getAlgodConfigFromViteEnvironment()
  const algorand = algokit.AlgorandClient.fromConfig({ algodConfig })
  algorand.setDefaultSigner(signer)

  const dmClient = new MarketplaceClient(
    {
      resolveBy: 'id',
      id: appId,
      sender: { addr: activeAddress!, signer },
    },
    algorand.client.algod,
  )

  return (
    <div className="hero min-h-screen bg-teal-400">
      <div className="hero-content text-center rounded-lg p-6 max-w-md bg-white mx-auto">
        <div className="max-w-md">
          <h1 className="text-4xl">
            Welcome to <div className="font-bold">AlgoKit 🙂</div>
          </h1>
          <p className="py-6">
            This starter has been generated using official AlgoKit React template. Refer to the resource below for next steps.
          </p>

          <div className="grid">
            <a
              data-test-id="getting-started"
              className="btn btn-primary m-2"
              target="_blank"
              href="https://github.com/algorandfoundation/algokit-cli"
            >
              Getting started
            </a>

            <div className="divider" />
            <button data-test-id="connect-wallet" className="btn m-2" onClick={toggleWalletModal}>
              Wallet Connection
            </button>

            <label className="label">App ID</label>
            <input
              type="number"
              className="input input-bordered"
              value={appId}
              min={0}
              onChange={(e) => {
                setAppId(Number(e.currentTarget.valueAsNumber))
              }}
            />

            {activeAddress && appId === 0 && (
              <div>
                <div>
                  <label className="label">Unitary Price</label>
                  <input
                    type="number"
                    className="input input-bordered"
                    value={(unitaryPrice / BigInt(1e6)).toString()}
                    onChange={(e) => {
                      setUnitaryPrice(BigInt(e.currentTarget.valueAsNumber || 0) * BigInt(1e6))
                    }}
                  />
                  <label className="label">Asset</label>
                  <input
                    type="number"
                    className="input input-bordered"
                    value={quantity.toString()}
                    onChange={(e) => {
                      setQuantity(BigInt(e.currentTarget.valueAsNumber))
                    }}
                  />
                </div>
                <div>
                  <MethodCall
                    methodFunction={methods.create(algorand, dmClient, activeAddress!, unitaryPrice, quantity, assetId, setAppId)}
                    text="Create Application"
                  />
                </div>
              </div>
            )}

            {appId !== 0 && (
              <div>
                <div>
                  <label className="label">Asset ID</label>
                  <input type="number" className="input input-bordered" value={assetId.toString()} />
                  <label className="label">Asset</label>
                  <input type="number" className="input input-bordered" value={(unitaryPrice / BigInt(1e6)).toString()} readOnly />
                  <label className="label">Assets Units left</label>
                  <input type="number" className="input input-bordered" value={unitsLeft.toString()} readOnly />
                </div>
              </div>
            )}
            {activeAddress && appId !== 0 && unitsLeft > 0n && (
              <div>
                <label className="label">Cuantos Assets desea comprar</label>
                <input
                  type="number"
                  className="input input-bordered"
                  value={quantity.toString()}
                  onChange={(e) => {
                    setQuantity(BigInt(e.currentTarget.valueAsNumber))
                  }}
                  max={unitsLeft.toString()}
                  min={0}
                />
                <MethodCall
                  methodFunction={methods.buy(
                    algorand,
                    dmClient,
                    activeAddress!,
                    algosdk.getApplicationAddress(appId),
                    quantity,
                    unitaryPrice,
                    setUnitsLeft,
                  )}
                  text={`Compare ${quantity} assets per ${(unitaryPrice * BigInt(quantity)) / BigInt(1e6)} ALGOs`}
                />
              </div>
            )}
          </div>

          <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
          <Transact openModal={openDemoModal} setModalState={setOpenDemoModal} />
          <AppCalls openModal={appCallsDemoModal} setModalState={setAppCallsDemoModal} />
        </div>
      </div>
    </div>
  )
}

export default Home
