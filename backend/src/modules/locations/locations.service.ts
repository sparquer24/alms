import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import prisma from '../../db/prismaClient';

@Injectable()
export class LocationsService {

  // States API - Single endpoint for all or specific state
  async getStates(id?: number) {
    try {
      if (id) {
        return await prisma.states.findUnique({
          where: { id },
          include: {
            districts: {
              orderBy: { name: 'asc' }
            }
          }
        });
      }
      return await prisma.states.findMany({
        orderBy: { name: 'asc' }
      });
    } catch (error) {
      console.error('Error in getStates:', error);
      throw error;
    }
  }

  // Districts API - Single endpoint for all or specific district
  async getDistricts(id?: number, stateId?: number) {
    try {
      if (id) {
        return await prisma.districts.findUnique({
          where: { id },
          include: {
            state: true,
            RangeOffices: {
              orderBy: { name: 'asc' }
            }
          }
        });
      }
      const where = stateId ? { stateId } : {};
      return await prisma.districts.findMany({
        where,
        include: {
          state: true
        },
        orderBy: { name: 'asc' }
      });
    } catch (error) {
      console.error('Error in getDistricts:', error);
      throw error;
    }
  }

  // Range Offices API - Single endpoint for all or specific range office
  async getRangeOffices(id?: number, districtId?: number) {
    try {
      if (id) {
        return await prisma.rangeOffices.findUnique({
          where: { id },
          include: {
            Districts: {
              include: {
                state: true
              }
            },
            Zones: {
              orderBy: { name: 'asc' }
            }
          }
        });
      }
      const where = districtId ? { districtId } : {};
      return await prisma.rangeOffices.findMany({
        where,
        include: {
          Districts: {
            include: {
              state: true
            }
          }
        },
        orderBy: { name: 'asc' }
      });
    } catch (error) {
      console.error('Error in getRangeOffices:', error);
      throw error;
    }
  }

  // Zones API - Single endpoint for all or specific zone
  async getZones(id?: number, rangeOfficeId?: number) {
    try {
      if (id) {
        return await prisma.zones.findUnique({
          where: { id },
          include: {
            RangeOffices: {
              include: {
                Districts: {
                  include: {
                    state: true
                  }
                }
              }
            },
            divisions: {
              orderBy: { name: 'asc' }
            }
          }
        });
      }
      const where = rangeOfficeId ? { rangeOfficeId } : {};
      return await prisma.zones.findMany({
        where,
        include: {
          RangeOffices: {
            include: {
              Districts: {
                include: {
                  state: true
                }
              }
            }
          }
        },
        orderBy: { name: 'asc' }
      });
    } catch (error) {
      console.error('Error in getZones:', error);
      throw error;
    }
  }

  // Divisions API - Single endpoint for all or specific division
  async getDivisions(id?: number, zoneId?: number) {
    try {
      if (id) {
        return await prisma.divisions.findUnique({
          where: { id },
          include: {
            zone: {
              include: {
                RangeOffices: {
                  include: {
                    Districts: {
                      include: {
                        state: true
                      }
                    }
                  }
                }
              }
            },
            stations: {
              orderBy: { name: 'asc' }
            }
          }
        });
      }
      const where = zoneId ? { zoneId } : {};
      return await prisma.divisions.findMany({
        where,
        include: {
          zone: {
            include: {
              RangeOffices: {
                include: {
                  Districts: {
                    include: {
                      state: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: { name: 'asc' }
      });
    } catch (error) {
      console.error('Error in getDivisions:', error);
      throw error;
    }
  }

  // Police Stations API - Single endpoint for all or specific police station
  async getPoliceStations(id?: number, divisionId?: number) {
    try {
      if (id) {
        return await prisma.policeStations.findUnique({
          where: { id },
          include: {
            division: {
              include: {
                zone: {
                  include: {
                    RangeOffices: {
                      include: {
                        Districts: {
                          include: {
                            state: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        });
      }
      const where = divisionId ? { divisionId } : {};
      return await prisma.policeStations.findMany({
        where,
        include: {
          division: {
            include: {
              zone: {
                include: {
                  RangeOffices: {
                    include: {
                      Districts: {
                        include: {
                          state: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: { name: 'asc' }
      });
    } catch (error) {
      console.error('Error in getPoliceStations:', error);
      throw error;
    }
  }

  // Hierarchical data fetching
  async getLocationHierarchy({ stateId, districtId, rangeOfficeId, zoneId, divisionId, policeStationId }: {
    stateId?: number,
    districtId?: number,
    rangeOfficeId?: number,
    zoneId?: number,
    divisionId?: number,
    policeStationId?: number
  } = {}) {
    try {
      if (policeStationId) {
        // Fetch police station and its hierarchy
        const ps = await prisma.policeStations.findUnique({
          where: { id: policeStationId },
          include: {
            division: {
              include: {
                zone: {
                  include: {
                    RangeOffices: {
                      include: {
                        Districts: {
                          include: {
                            state: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        });
        return ps;
      }
      if (divisionId) {
        // Fetch division and its hierarchy
        const division = await prisma.divisions.findUnique({
          where: { id: divisionId },
          include: {
            zone: {
              include: {
                RangeOffices: {
                  include: {
                    Districts: {
                      include: {
                        state: true
                      }
                    }
                  }
                }
              }
            },
            stations: true
          }
        });
        return division;
      }
      if (zoneId) {
        // Fetch zone and its hierarchy
        const zone = await prisma.zones.findUnique({
          where: { id: zoneId },
          include: {
            RangeOffices: {
              include: {
                Districts: {
                  include: {
                    state: true
                  }
                }
              }
            },
            divisions: {
              include: {
                stations: true
              }
            }
          }
        });
        return zone;
      }
      if (rangeOfficeId) {
        // Fetch range office and its hierarchy
        const rangeOffice = await prisma.rangeOffices.findUnique({
          where: { id: rangeOfficeId },
          include: {
            Districts: {
              include: {
                state: true
              }
            },
            Zones: {
              include: {
                divisions: {
                  include: {
                    stations: true
                  }
                }
              }
            }
          }
        });
        return rangeOffice;
      }
      if (districtId) {
        // Fetch district and its hierarchy
        const district = await prisma.districts.findUnique({
          where: { id: districtId },
          include: {
            state: true,
            RangeOffices: {
              include: {
                Zones: {
                  include: {
                    divisions: {
                      include: {
                        stations: true
                      }
                    }
                  }
                }
              }
            }
          }
        });
        return district;
      }
      if (stateId) {
        // Fetch state and its hierarchy
        const state = await prisma.states.findUnique({
          where: { id: stateId },
          include: {
            districts: {
              include: {
                RangeOffices: {
                  include: {
                    Zones: {
                      include: {
                        divisions: {
                          include: {
                            stations: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        });
        return state;
      }
      // Default: fetch all states and full hierarchy
      return await prisma.states.findMany({
        include: {
          districts: {
            include: {
              RangeOffices: {
                include: {
                  Zones: {
                    include: {
                      divisions: {
                        include: {
                          stations: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: { name: 'asc' }
      });
    } catch (error) {
      console.error('Error in getLocationHierarchy:', error);
      throw error;
    }
  }

  /* ===== HIERARCHY VALIDATION ===== */

  /**
   * Validate that the provided stateId and districtId form a valid hierarchy.
   *
   * Rules:
   *  - If both stateId and districtId are provided:
   *      * Verify the State exists.
   *      * Verify the District exists.
   *      * Verify District.stateId === stateId.
   *  - If only districtId is provided:
   *      * Verify the District exists.
   *  - If only stateId is provided:
   *      * Verify the State exists.
   *  - If neither is provided: no validation (global context).
   *
   * Throws BadRequestException or NotFoundException on invalid input.
   * Returns { stateId, districtId } with the resolved/corrected values.
   */
  async validateStateDistrictHierarchy(
    stateId?: number | null,
    districtId?: number | null,
  ): Promise<{ stateId: number | null; districtId: number | null }> {
    // Neither provided — global context, nothing to validate
    if (stateId == null && districtId == null) {
      return { stateId: null, districtId: null };
    }

    // Only stateId provided — verify the State exists
    if (stateId != null && districtId == null) {
      const state = await prisma.states.findUnique({ where: { id: stateId } });
      if (!state) {
        throw new NotFoundException(`State with ID ${stateId} not found`);
      }
      return { stateId, districtId: null };
    }

    // Only districtId provided — verify the District exists
    if (stateId == null && districtId != null) {
      const district = await prisma.districts.findUnique({ where: { id: districtId } });
      if (!district) {
        throw new NotFoundException(`District with ID ${districtId} not found`);
      }
      return { stateId: null, districtId };
    }

    // Both stateId and districtId provided — verify both exist and district belongs to state
    const [state, district] = await Promise.all([
      prisma.states.findUnique({ where: { id: stateId! } }),
      prisma.districts.findUnique({ where: { id: districtId! } }),
    ]);

    if (!state) {
      throw new NotFoundException(`State with ID ${stateId} not found`);
    }
    if (!district) {
      throw new NotFoundException(`District with ID ${districtId} not found`);
    }
    if (district.stateId !== stateId!) {
      throw new BadRequestException(
        `Selected District (ID ${districtId}, belonging to State ID ${district.stateId}) does not belong to the selected State (ID ${stateId}).`,
      );
    }

    return { stateId: stateId!, districtId: districtId! };
  }

  /* ===== CREATE METHODS ===== */

  async createState(name: string) {
    try {
      const trimmed = (name || '').trim();
      if (!trimmed) {
        throw new Error('State name is required');
      }
      const now = new Date();
      return await prisma.states.create({
        data: {
          name: trimmed,
          createdAt: now,
          updatedAt: now,
        },
      });
    } catch (error: any) {
      console.error('Error in createState:', error);
      throw new Error(error.message || 'Failed to create state');
    }
  }

  async createDistrict(stateId: number, name: string) {
    try {
      return await prisma.districts.create({
        data: {
          name: name.trim(),
          stateId,
        },
        include: { state: true },
      });
    } catch (error: any) {
      console.error('Error in createDistrict:', error);
      throw new Error(error.message || 'Failed to create district');
    }
  }

  async createRangeOffice(districtId: number, name: string) {
    try {
      const now = new Date();
      return await prisma.rangeOffices.create({
        data: {
          name: name.trim(),
          districtId,
          updatedAt: now,
        },
        include: { Districts: { include: { state: true } } },
      });
    } catch (error: any) {
      console.error('Error in createRangeOffice:', error);
      throw new Error(error.message || 'Failed to create range office');
    }
  }

  async createZone(rangeOfficeId: number, name: string) {
    try {
      return await prisma.zones.create({
        data: {
          name: name.trim(),
          rangeOfficeId,
        },
        include: { RangeOffices: { include: { Districts: { include: { state: true } } } } },
      });
    } catch (error: any) {
      console.error('Error in createZone:', error);
      throw new Error(error.message || 'Failed to create zone');
    }
  }

  async createDivision(zoneId: number, name: string) {
    try {
      return await prisma.divisions.create({
        data: {
          name: name.trim(),
          zoneId,
        },
        include: { zone: { include: { RangeOffices: { include: { Districts: { include: { state: true } } } } } } },
      });
    } catch (error: any) {
      console.error('Error in createDivision:', error);
      throw new Error(error.message || 'Failed to create division');
    }
  }

  async createPoliceStation(divisionId: number, name: string) {
    try {
      return await prisma.policeStations.create({
        data: {
          name: name.trim(),
          divisionId,
        },
        include: { division: { include: { zone: { include: { RangeOffices: { include: { Districts: { include: { state: true } } } } } } } } },
      });
    } catch (error: any) {
      console.error('Error in createPoliceStation:', error);
      throw new Error(error.message || 'Failed to create police station');
    }
  }

  /* ===== UPDATE METHODS ===== */

  async updateState(id: number, name: string) {
    try {
      return await prisma.states.update({
        where: { id },
        data: {
          name: name.trim(),
        },
      });
    } catch (error: any) {
      console.error('Error in updateState:', error);
      throw new Error(error.message || 'Failed to update state');
    }
  }

  async updateDistrict(id: number, name: string) {
    try {
      return await prisma.districts.update({
        where: { id },
        data: {
          name: name.trim(),
        },
        include: { state: true },
      });
    } catch (error: any) {
      console.error('Error in updateDistrict:', error);
      throw new Error(error.message || 'Failed to update district');
    }
  }

  async updateRangeOffice(id: number, name: string) {
    try {
      const now = new Date();
      return await prisma.rangeOffices.update({
        where: { id },
        data: {
          name: name.trim(),
          updatedAt: now,
        },
        include: { Districts: { include: { state: true } } },
      });
    } catch (error: any) {
      console.error('Error in updateRangeOffice:', error);
      throw new Error(error.message || 'Failed to update range office');
    }
  }

  async updateZone(id: number, name: string) {
    try {
      return await prisma.zones.update({
        where: { id },
        data: {
          name: name.trim(),
        },
        include: { RangeOffices: { include: { Districts: { include: { state: true } } } } },
      });
    } catch (error: any) {
      console.error('Error in updateZone:', error);
      throw new Error(error.message || 'Failed to update zone');
    }
  }

  async updateDivision(id: number, name: string) {
    try {
      return await prisma.divisions.update({
        where: { id },
        data: {
          name: name.trim(),
        },
        include: { zone: { include: { RangeOffices: { include: { Districts: { include: { state: true } } } } } } },
      });
    } catch (error: any) {
      console.error('Error in updateDivision:', error);
      throw new Error(error.message || 'Failed to update division');
    }
  }

  async updatePoliceStation(id: number, name: string) {
    try {
      return await prisma.policeStations.update({
        where: { id },
        data: {
          name: name.trim(),
        },
        include: { division: { include: { zone: { include: { RangeOffices: { include: { Districts: { include: { state: true } } } } } } } } },
      });
    } catch (error: any) {
      console.error('Error in updatePoliceStation:', error);
      throw new Error(error.message || 'Failed to update police station');
    }
  }

  /* ===== DELETE METHODS ===== */

  async deleteState(id: number) {
    try {
      return await prisma.states.delete({
        where: { id },
      });
    } catch (error: any) {
      console.error('Error in deleteState:', error);
      throw new Error(error.message || 'Failed to delete state');
    }
  }

  async deleteDistrict(id: number) {
    try {
      return await prisma.districts.delete({
        where: { id },
      });
    } catch (error: any) {
      console.error('Error in deleteDistrict:', error);
      throw new Error(error.message || 'Failed to delete district');
    }
  }

  async deleteRangeOffice(id: number) {
    try {
      return await prisma.rangeOffices.delete({
        where: { id },
      });
    } catch (error: any) {
      console.error('Error in deleteRangeOffice:', error);
      throw new Error(error.message || 'Failed to delete range office');
    }
  }

  async deleteZone(id: number) {
    try {
      return await prisma.zones.delete({
        where: { id },
      });
    } catch (error: any) {
      console.error('Error in deleteZone:', error);
      throw new Error(error.message || 'Failed to delete zone');
    }
  }

  async deleteDivision(id: number) {
    try {
      return await prisma.divisions.delete({
        where: { id },
      });
    } catch (error: any) {
      console.error('Error in deleteDivision:', error);
      throw new Error(error.message || 'Failed to delete division');
    }
  }

  async deletePoliceStation(id: number) {
    try {
      return await prisma.policeStations.delete({
        where: { id },
      });
    } catch (error: any) {
      console.error('Error in deletePoliceStation:', error);
      throw new Error(error.message || 'Failed to delete police station');
    }
  }

  async getEligibleAndAssignedUsers(type: string, id: number) {
    try {
      const roleCodesMap: Record<string, string[]> = {
        state: ['ADMIN'],
        district: ['CP', 'JTCP', 'CADO', 'ADO', 'AS', 'ARMS_SUPDT', 'ARMS_SEAT', 'ACO'],
        range: ['RANGE'],
        zone: ['DCP'],
        division: ['ACP'],
        station: ['SHO'],
      };
      const roles = roleCodesMap[type] || [];

      const eligibleUsers = await prisma.users.findMany({
        where: {
          role: {
            code: { in: roles },
          },
        },
        select: {
          id: true,
          username: true,
          email: true,
          phoneNo: true,
          role: {
            select: {
              code: true,
              name: true,
            },
          },
        },
        orderBy: {
          username: 'asc',
        },
      });

      const fieldMap: Record<string, string> = {
        state: 'stateId',
        district: 'districtId',
        range: 'rangeOfficeId',
        zone: 'zoneId',
        division: 'divisionId',
        station: 'policeStationId',
      };
      const fieldName = fieldMap[type];
      let assignedUser = null;

      if (fieldName) {
        assignedUser = await prisma.users.findFirst({
          where: {
            [fieldName]: id,
            role: {
              code: { in: roles },
            },
          },
          select: {
            id: true,
            username: true,
            email: true,
            phoneNo: true,
            role: {
              select: {
                code: true,
                name: true,
              },
            },
          },
        });
      }

      return {
        eligibleUsers,
        assignedUser,
      };
    } catch (error) {
      console.error('Error in getEligibleAndAssignedUsers:', error);
      throw error;
    }
  }

  async updateLocationAssignment(type: string, locationId: number, assignedUserId: number | null) {
    try {
      const roleCodesMap: Record<string, string[]> = {
        state: ['ADMIN'],
        district: ['CP', 'JTCP', 'CADO', 'ADO', 'AS', 'ARMS_SUPDT', 'ARMS_SEAT', 'ACO'],
        zone: ['DCP'],
        division: ['ACP'],
        range: ['RANGE'],
        station: ['SHO'],
      };
      const roles = roleCodesMap[type] || [];

      const fieldMap: Record<string, string> = {
        state: 'stateId',
        district: 'districtId',
        range: 'rangeOfficeId',
        zone: 'zoneId',
        division: 'divisionId',
        station: 'policeStationId',
      };
      const fieldName = fieldMap[type];

      if (!fieldName) {
        throw new Error(`Invalid location type: ${type}`);
      }

      // 1. Clear previous assignments for this location
      const currentAssignedUsers = await prisma.users.findMany({
        where: {
          [fieldName]: locationId,
          role: {
            code: { in: roles },
          },
        },
      });

      for (const u of currentAssignedUsers) {
        await prisma.users.update({
          where: { id: u.id },
          data: {
            stateId: null,
            districtId: null,
            zoneId: null,
            divisionId: null,
            rangeOfficeId: null,
            policeStationId: null,
          },
        });
      }

      // 2. If a new user is assigned, set their location hierarchy
      if (assignedUserId) {
        const hierarchy = await this.resolveLocationHierarchy(type, locationId);
        await prisma.users.update({
          where: { id: assignedUserId },
          data: hierarchy,
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error in updateLocationAssignment:', error);
      throw error;
    }
  }

  private async resolveLocationHierarchy(type: string, id: number) {
    let stateId: number | null = null;
    let districtId: number | null = null;
    let rangeOfficeId: number | null = null;
    let zoneId: number | null = null;
    let divisionId: number | null = null;
    let policeStationId: number | null = null;

    if (type === 'state') {
      stateId = id;
    } else if (type === 'district') {
      const district = await prisma.districts.findUnique({
        where: { id },
      });
      stateId = district?.stateId || null;
      districtId = id;
    } else if (type === 'range') {
      const ro = await prisma.rangeOffices.findUnique({
        where: { id },
        include: { Districts: true }
      });
      stateId = ro?.Districts?.stateId || null;
      districtId = ro?.districtId || null;
      rangeOfficeId = id;
    } else if (type === 'zone') {
      const zone = await prisma.zones.findUnique({
        where: { id },
        include: {
          RangeOffices: {
            include: { Districts: true }
          }
        }
      });
      stateId = zone?.RangeOffices?.Districts?.stateId || null;
      districtId = zone?.RangeOffices?.districtId || null;
      rangeOfficeId = zone?.rangeOfficeId || null;
      zoneId = id;
    } else if (type === 'division') {
      const division = await prisma.divisions.findUnique({
        where: { id },
        include: {
          zone: {
            include: {
              RangeOffices: {
                include: { Districts: true }
              }
            }
          }
        }
      });
      stateId = division?.zone?.RangeOffices?.Districts?.stateId || null;
      districtId = division?.zone?.RangeOffices?.districtId || null;
      rangeOfficeId = division?.zone?.rangeOfficeId || null;
      zoneId = division?.zoneId || null;
      divisionId = id;
    } else if (type === 'station') {
      const ps = await prisma.policeStations.findUnique({
        where: { id },
        include: {
          division: {
            include: {
              zone: {
                include: {
                  RangeOffices: {
                    include: { Districts: true }
                  }
                }
              }
            }
          }
        }
      });
      stateId = ps?.division?.zone?.RangeOffices?.Districts?.stateId || null;
      districtId = ps?.division?.zone?.RangeOffices?.districtId || null;
      rangeOfficeId = ps?.division?.zone?.rangeOfficeId || null;
      zoneId = ps?.division?.zoneId || null;
      divisionId = ps?.divisionId || null;
      policeStationId = id;
    }

    return {
      stateId,
      districtId,
      rangeOfficeId,
      zoneId,
      divisionId,
      policeStationId
    };
  }
}
