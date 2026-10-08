import { IsEmail, IsIn, MaxLength } from 'class-validator';
import { INVITE_ROLES, NAME_MAX, WorkspaceRole, type CreateInviteInput, type UpdateMemberInput } from '@folio/shared';

export class CreateInviteDto implements CreateInviteInput {
  @IsEmail() @MaxLength(NAME_MAX)
  email: string;

  @IsIn(INVITE_ROLES)
  role: WorkspaceRole;
}

export class UpdateMemberDto implements UpdateMemberInput {
  @IsIn(Object.values(WorkspaceRole))
  role: WorkspaceRole;
}
