import { Controller, Get, Post, UseGuards } from '@nestjs/common'
import { AdminService } from './admin.service'
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard'

@Controller('admin')
@UseGuards(AuthenticatedGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboard()
  }

  @Get('whitelist')
  getWhitelist() {
    return this.adminService.getWhitelist()
  }

  @Post('rounds/create')
  createNewRound() {
    return this.adminService.createNewRound()
  }
}
