import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from 'src/users/users.service';
import { BanUserInput } from '../dto/ban-user.input';
import { ModerationAction } from '../entities/moderation-action.enum';
import { AdminLog } from '../entities/admin-log.entity';
import { UserStatus } from 'src/users/enums/user-status.enum';

@Injectable()
export class AdminUsersService {
  constructor(
    private usersService: UsersService,
    @InjectRepository(AdminLog) private logRepo: Repository<AdminLog>
  ) {}

  async ban(input: BanUserInput, adminId: string) {
    // 1. Оновлюємо статус юзера через базовий сервіс
    await this.usersService.updateStatus(input.userId, UserStatus.BANNED);
    
    // 2. Логуємо дію
    await this.logRepo.save({
      adminId,
      action: ModerationAction.BAN,
      targetId: input.userId,
      reason: input.reason
    });
    
    return true;
  }
}