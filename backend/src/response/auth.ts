import { ApiProperty } from '@nestjs/swagger';

export class LoginResponse {
  @ApiProperty({ description: 'Login success status', example: true })
  success!: boolean;

  @ApiProperty({ 
    description: 'JWT token for authentication', 
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' 
  })
  token!: string;

  @ApiProperty({
    description: 'User information',
    example: {
      id: '1',
      username: 'dcp_user',
      email: 'dcp@example.com',
      role: {
        id: 8,
        code: 'CADO',
        name: 'Chief Administrative Officer',
        is_active: true,
        created_at: '2025-09-22T07:31:16.924Z',
        updated_at: '2025-09-22T07:31:16.924Z',
        dashboard_title: 'CADO Dashboard',
        menu_items: '["inbox","sent","finaldisposal"]',
        permissions: '["read","write"]',
        can_access_settings: true,
        can_forward: false,
        can_re_enquiry: false,
        can_generate_ground_report: false,
        can_FLAF: false,
        can_create_freshLicence: false
      }
    }
  })
  user!: {
    id: string;
    username: string;
    email?: string;
    role?: any; // keeping flexible for enriched role object
  };
}

export class UserProfileResponse {
  @ApiProperty({ description: 'User ID', example: '1' })
  id!: string;

  @ApiProperty({ description: 'Username', example: 'dcp_user' })
  username!: string;

  @ApiProperty({ description: 'User email', example: 'dcp@example.com', required: false })
  email?: string;

  @ApiProperty({ description: 'Account creation date', example: '2025-08-20T12:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ description: 'Account last update date', example: '2025-08-20T12:00:00.000Z' })
  updatedAt!: Date;

  @ApiProperty({ description: 'User role information with permissions and UI configuration', required: false, example: {
    id: 8,
    code: 'CADO',
    name: 'Chief Administrative Officer',
    is_active: true,
    created_at: '2025-09-22T07:31:16.924Z',
    updated_at: '2025-09-22T07:31:16.924Z',
    dashboard_title: 'CADO Dashboard',
    menu_items: ['inbox','sent','finaldisposal'],
    permissions: ['read','write'],
    can_access_settings: true,
    can_forward: false,
    can_re_enquiry: false,
    can_generate_ground_report: false,
    can_FLAF: false,
    can_create_freshLicence: false
  } })
  role?: {
    id: number;
    code: string;
    name: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
    dashboard_title: string;
    menu_items?: any; // stored as Json in DB
    permissions?: any; // stored as Json in DB
    can_access_settings: boolean;
    can_forward: boolean;
    can_re_enquiry: boolean;
    can_generate_ground_report: boolean;
    can_FLAF: boolean;
    can_create_freshLicence: boolean;
  };

  @ApiProperty({ description: 'User location hierarchy (state, district, division, zone, policeStation)', required: false, example: { state: { id: '1', name: 'State A' }, district: { id: '2', name: 'District B' } } })
  location?: {
    state?: { id: string; name: string };
    district?: { id: string; name: string };
    division?: { id: string; name: string };
    zone?: { id: string; name: string };
    policeStation?: { id: string; name?: string };
  };
}

export class ErrorResponse {
  @ApiProperty({ description: 'Error status', example: false })
  success!: false;

  @ApiProperty({ description: 'Error message', example: 'Invalid credentials' })
  message!: string;

  @ApiProperty({ description: 'Detailed error information', required: false })
  error?: string;
}
