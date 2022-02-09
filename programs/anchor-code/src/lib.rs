use anchor_lang::prelude::*;

declare_id!("GTuzvZ9JDQcvPhjAAehRJi72d68m9SqAHq8c6awLViYC");

#[program]
pub mod anchor_code {
    use super::*;

    pub fn create(ctx: Context<Create>, owner_pk: Pubkey) -> ProgramResult {
        let acc = &mut ctx.accounts.data_holder;
        if acc.owner != Pubkey::default() && acc.owner != owner_pk {
            return Err(ProgramError::IllegalOwner)
        }
        acc.owner = owner_pk;
        Ok(())
    }

    pub fn update(ctx: Context<Update>, data: Vec<u8>) -> ProgramResult {
        let acc = &mut ctx.accounts.holder;
        acc.data = data;
        Ok(())
    }
}

#[account]
pub struct DataHolder {
    pub owner: Pubkey,
    pub data: Vec<u8>
}

#[derive(Accounts)]
pub struct Create<'info> {
    #[account(init_if_needed, payer=owner, space=256)]
    pub data_holder: Account<'info, DataHolder>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Update<'info> {
    #[account(mut, has_one=owner)]
    pub holder: Account<'info, DataHolder>,
    pub owner: Signer<'info>,
}