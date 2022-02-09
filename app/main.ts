import * as fs from 'fs'
import * as anchor from '@project-serum/anchor'
import * as readline from 'node:readline'
import {stdin as input, stdout as output} from 'process'

const LOCAL_KEYPAIR = '/home/user/solana/keys/my-keys.json'

async function main() {
    const idl = JSON.parse(
        fs.readFileSync("target/idl/anchor_code.json", "utf8").toString()
    );

    const wallet = new anchor.Wallet(
        anchor.web3.Keypair.fromSecretKey(
            Buffer.from(
                JSON.parse(
                    fs.readFileSync(
                        LOCAL_KEYPAIR, {encoding: "utf-8"}
                    )
                )
            )
        )
    )

    const connection = new anchor.web3.Connection(
        'http://localhost:8899',
        'confirmed'
    );

    const opts: anchor.web3.ConfirmOptions = {
        preflightCommitment: "recent",
    }

    const provider = new anchor.Provider(connection, wallet, opts)

    const program = new anchor.Program(idl, idl.metadata.address, provider);

    let account: anchor.web3.Keypair = null

    console.log('use REPL to interact with solana (run \'HELP\' for more)')

    repl:while (true) {
        const line: string = await getLine()
        const parts = line.split(' ')

        if (parts.length < 1) {
            console.log('command is not provided...')
        }

        const command = parts[0].toUpperCase().trim()
        try {
            switch (command) {
                case 'HELP':
                    console.log('possible commands (case insensitive): HELP, LOAD, STORE <DATA>, HOLDER <SEED>')
                    break
                case 'LOAD':
                    // load data
                    if (account === null) {
                        console.log('error: no holder')
                        continue
                    }
                    const holderData = await program.account.dataHolder.fetch(account.publicKey)
                    console.log(holderData.data.toString())
                    break
                case 'STORE':
                    // store data
                    if (account === null) {
                        console.log('error: no holder')
                        continue
                    }
                    if (parts.length < 2) {
                        console.log('error: incorrect command format (<DATA> expected)')
                        continue
                    }
                    const data = parts[1]
                    await program.rpc.update(Buffer.from(data), {
                        accounts: {
                            holder: account.publicKey,
                            owner: wallet.publicKey,
                        },
                    })
                    break
                case 'HOLDER':
                    if (parts.length < 2) {
                        console.log('error: incorrect command format (<HOLDER> expected)')
                        continue
                    }

                    account = seed2keypair(parts[1])
                    console.log('generated pubkey:', account.publicKey.toString())
                    await program.rpc.create(wallet.publicKey, {
                        accounts: {
                            dataHolder: account.publicKey,
                            owner: wallet.publicKey,
                            systemProgram: anchor.web3.SystemProgram.programId
                        },
                        signers: [account]
                    });
                    break
                case 'EXIT':
                    break repl
                default:
                    console.log('error: invalid command')
            }
            console.log('DONE')
        } catch (ex) {
            console.log('error:', ex)
        }
    }
}

main().then(() => console.log('FINISHING'))

function seed2keypair(seed: string): anchor.web3.Keypair {
    let codePoints = seed.split('')
        .map(c => c.codePointAt(0))

    let validSeed = new Array(32).fill(0)

    for (let i = 0; i < validSeed.length; i++) {
        let val = 0;
        for (let j = 0; j < 5; j += 2) {
            val += codePoints[(i + j) % codePoints.length]
        }
        validSeed[i] = Math.abs(val) % 256
    }
    return anchor.web3.Keypair.fromSeed(Uint8Array.from(validSeed))
}

function getLine(): Promise<string> {
    return new Promise((ok, err) => {
        try {
            let iface = readline.createInterface({input, output});
            iface.on('line', line => {
                iface.close();
                ok(line);
            })
        } catch (ex) {
            err(ex)
        }
    })
}
