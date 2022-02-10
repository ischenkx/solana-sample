use anchor_lang::prelude::*;
use anchor_spl::token;

declare_id!("GTuzvZ9JDQcvPhjAAehRJi72d68m9SqAHq8c6awLViYC");

#[program]
pub mod anchor_code {
    use super::*;

    pub fn transfer(ctx: Context<Transfer>, amount: u64) -> ProgramResult {
        msg!(
            "transfering: {} -({} sol)-> {}",
            ctx.accounts.from.key,
            amount,
            ctx.accounts.to.key
        );

        let from = &mut ctx.accounts.from;
        let to = &mut ctx.accounts.to;

        **(from.try_borrow_mut_lamports()?) = from.lamports()
            .checked_sub(amount)
            .ok_or(ProgramError::InvalidArgument)?;

        **(to.try_borrow_mut_lamports()?) = to.lamports()
            .checked_add(amount)
            .ok_or(ProgramError::InvalidArgument)?;
        Ok(())
    }

    pub fn create(ctx: Context<Create>, account_size: u64, owner_pk: Pubkey) -> ProgramResult {
        msg!(format!("creating account of size {} bytes", account_size).as_str());
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

#[instruction(account_size: usize)]
#[derive(Accounts)]
pub struct Create<'info> {
    #[account(init_if_needed, payer=owner, space=account_size)]
    pub data_holder: Account<'info, DataHolder>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>
}

#[derive(Accounts)]
pub struct Update<'info> {
    #[account(mut, has_one=owner)]
    pub holder: Account<'info, DataHolder>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct Transfer<'info> {
    #[account(mut, signer)]
    pub from: AccountInfo<'info>,
    #[account(mut)]
    pub to: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}