import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
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

  // Create a new state
  async createState(stateData: { name: string }) {
    try {
      const name = stateData.name?.trim();
      if (!name) {
        throw new HttpException('State name is required', HttpStatus.BAD_REQUEST);
      }

      // Check for existing by name
      const existing = await prisma.states.findFirst({ where: { name } });
      if (existing) {
        throw new HttpException('State already exists', HttpStatus.CONFLICT);
      }

      const created = await prisma.states.create({ data: { name } });
      return created;
    } catch (error) {
      console.error('Error in createState:', error);
      throw error;
    }
  }

  // Update an existing state
  async updateState(id: number, data: { name?: string }) {
    try {
      const existing = await prisma.states.findUnique({ where: { id } });
      if (!existing) {
        throw new HttpException('State not found', HttpStatus.NOT_FOUND);
      }

      if (data.name) {
        const name = data.name.trim();
        // Check for name conflict with other records
        const conflict = await prisma.states.findFirst({ where: { name, NOT: { id } } });
        if (conflict) {
          throw new HttpException('State name already in use', HttpStatus.CONFLICT);
        }
      }

      const updated = await prisma.states.update({ where: { id }, data });
      return updated;
    } catch (error) {
      console.error('Error in updateState:', error);
      throw error;
    }
  }

  // Delete a state by id
  async deleteState(id: number) {
    try {
      const existing = await prisma.states.findUnique({ where: { id } });
      if (!existing) {
        throw new HttpException('State not found', HttpStatus.NOT_FOUND);
      }
      // Delete will cascade to dependent records as per schema cascades
      const deleted = await prisma.states.delete({ where: { id } });
      return deleted;
    } catch (error) {
      console.error('Error in deleteState:', error);
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
            zones: {
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

  // Zones API - Single endpoint for all or specific zone
  async getZones(id?: number, districtId?: number) {
    try {
      if (id) {
        return await prisma.zones.findUnique({
          where: { id },
          include: {
            district: {
              include: {
                state: true
              }
            },
            divisions: {
              orderBy: { name: 'asc' }
            }
          }
        });
      }
      const where = districtId ? { districtId } : {};
      return await prisma.zones.findMany({
        where,
        include: {
          district: {
            include: {
              state: true
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
                district: {
                  include: {
                    state: true
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
              district: {
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
                    district: {
                      include: {
                        state: true
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
                  district: {
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
      console.error('Error in getPoliceStations:', error);
      throw error;
    }
  }

  // Hierarchical data fetching
  async getLocationHierarchy({ stateId, districtId, zoneId, divisionId, policeStationId }: {
    stateId?: number,
    districtId?: number,
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
                    district: {
                      include: {
                        state: true
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
                district: {
                  include: {
                    state: true
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
            district: {
              include: {
                state: true
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
      if (districtId) {
        // Fetch district and its hierarchy
        const district = await prisma.districts.findUnique({
          where: { id: districtId },
          include: {
            state: true,
            zones: {
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
        return district;
      }
      if (stateId) {
        // Fetch state and its hierarchy
        const state = await prisma.states.findUnique({
          where: { id: stateId },
          include: {
            districts: {
              include: {
                zones: {
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
        return state;
      }
      // Default: fetch all states and full hierarchy
      return await prisma.states.findMany({
        include: {
          districts: {
            include: {
              zones: {
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
        },
        orderBy: { name: 'asc' }
      });
    } catch (error) {
      console.error('Error in getLocationHierarchy:', error);
      throw error;
    }
  }
}
