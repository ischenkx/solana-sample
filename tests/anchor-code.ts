import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { AnchorCode } from '../target/types/anchor_code';

describe('anchor-code', () => {

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.AnchorCode as Program<AnchorCode>;

  it('Is initialized!', async () => {
    // Add your test here.
    const tx = await program.rpc.initialize({});
    console.log("Your transaction signature", tx);
  });
});
