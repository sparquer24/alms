import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

async function main() {
  // --- Hyderabad Police Users and Roles Seeding ---
  console.log('Starting seeding process...');

  // --- Actions Seeding ---
  console.log('Seeding statuses and actions...');
  const statuses = [
    { code: 'FORWARD', name: 'Forward', description: 'Application forwarded to next stage' },
    { code: 'REJECT', name: 'Reject', description: 'Application rejected' },
    { code: 'APPROVED', name: 'Approved', description: 'Application approved' },
    { code: 'CANCEL', name: 'Cancel', description: 'Application cancelled' },
    { code: 'RE_ENQUIRY', name: 'Re-Enquiry', description: 'Re-enquiry required' },
    { code: 'GROUND_REPORT', name: 'Ground Report', description: 'Ground report required' },
    { code: 'DISPOSE', name: 'Dispose', description: 'Application disposed' },
    { code: 'RED_FLAG', name: 'Red-Flag', description: 'Red-flagged application' },
    { code: 'INITIATED', name: 'Initiated', description: 'Application initiated' },
    { code: 'CLOSE', name: 'Close', description: 'Application closed' },
    { code: 'RECOMMEND', name: 'Recommend', description: 'Application recommended' },
    { code: 'NOT_RECOMMEND', name: 'Not Recommend', description: 'Application not recommended' },
    { code: 'DRAFT', name: 'Draft', description: 'Draft status' },
    { code: 'RETURN', name: 'Return', description: 'Application returned for corrections' }
  ];

  // Seed statuses if not present
  for (const status of statuses) {
    const exists = await prisma.statuses.findUnique({ where: { code: status.code } });
    if (!exists) {
      await prisma.statuses.create({
        data: {
          code: status.code,
          name: status.name,
          description: status.description,
          isActive: true,
          isStarted: false,
        },
      });
    }
  }

  // Now seed actions, linking to statuses
  for (const action of statuses) {
    const status = await prisma.statuses.findUnique({ where: { code: action.code } });
    if (!status) continue;

    // Check if action already exists
    const existingAction = await prisma.actiones.findUnique({ where: { code: action.code } });
    if (existingAction) continue;

    await prisma.actiones.create({
      data: {
        code: action.code,
        name: action.name,
        description: action.description,
        isActive: true,
      },
    });
  }

  console.log('Seeding roles...');
  const roles = [
    { code: 'CP', name: 'Commissioner of Police', dashboardTitle: 'CP Dashboard', menuItems: [], permissions: [], canAccessSettings: false },
    { code: 'JTCP', name: 'Joint Commissioner of Police', dashboardTitle: 'JTCP Dashboard', menuItems: [], permissions: [], canAccessSettings: false },
    { code: 'ADMIN', name: 'System Administrator', dashboardTitle: 'Admin Dashboard', menuItems: ['userManagement', 'roleMapping', 'analytics', 'flowMapping'], permissions: ['read', 'write', 'admin'], canAccessSettings: true },
    { code: 'CADO', name: 'Chief Administrative Officer', dashboardTitle: 'CADO Dashboard', menuItems: ['inbox', 'sent'], permissions: ['read', 'write'], canAccessSettings: true },
    { code: 'ADO', name: 'Administrative Officer', dashboardTitle: 'ADO Dashboard', menuItems: [], permissions: [], canAccessSettings: false },
    { code: 'DCP', name: 'Deputy Commissioner of Police', dashboardTitle: 'DCP Dashboard', menuItems: ['inbox', 'sent'], permissions: ['read', 'write', 'approve'], canAccessSettings: true },
    { code: 'ZS', name: 'Zonal Superintendent', dashboardTitle: 'ZS Dashboard', menuItems: ['inbox', 'freshform', 'sent', 'closed', 'drafts', 'finaldisposal'], permissions: ['read', 'write', 'canViewFreshForm'], canAccessSettings: false },
    { code: 'SHO', name: 'Station House Officer', dashboardTitle: 'SHO Dashboard', menuItems: ['inbox', 'sent'], permissions: ['read'], canAccessSettings: true },
    { code: 'ACP', name: 'Assistant Commissioner of Police', dashboardTitle: 'ACP Dashboard', menuItems: ['inbox', 'sent'], permissions: ['read', 'write'], canAccessSettings: true },
    { code: 'AS', name: 'Arms Superintendent', dashboardTitle: 'AS Dashboard', menuItems: [], permissions: [], canAccessSettings: false },
  ];
  for (const role of roles) {
    // Check if role already exists
    const existingRole = await prisma.roles.findUnique({ where: { code: role.code } });
    if (existingRole) continue;

    const roleData: any = {
      code: role.code,
      name: role.name,
      is_active: true,
      dashboard_title: role.dashboardTitle || null,
      menu_items: role.menuItems ? JSON.stringify(role.menuItems) : null,
      permissions: role.permissions ? JSON.stringify(role.permissions) : null,
      can_access_settings: role.canAccessSettings || false,
      can_forward: false,
      can_re_enquiry: false,
      can_generate_ground_report: false,
      can_FLAF: false,
    };

    await prisma.roles.create({ data: roleData as any });
  }

  const roleMap: Record<string, number> = {};
  const dbRoles = await prisma.roles.findMany();
  dbRoles.forEach(r => { roleMap[r.code] = r.id; });

  console.log('Seeding states and districts...');

  // Master mapping of states/UTs to their districts (partial — based on provided data)
  const statesWithDistricts: Array<{ name: string; districts: string[] }> = [
    { name: 'Andhra Pradesh', districts: [
      'Alluri Sitharama Raju','Anakapalli','Anantapur','Annamayya','Bapatla','Chittoor','East Godavari','Eluru','Guntur','Kakinada','Konaseema','Krishna','Kurnool','Nandyal','NTR','Palnadu','Prakasam','Sri Potti Sriramulu Nellore','Sri Sathya Sai','Srikakulam','Tirupati','Visakhapatnam','Vizianagaram','West Godavari','YSR','YSR Kadapa'
    ]},
    { name: 'Arunachal Pradesh', districts: [
      'Tawang','West Kameng','East Kameng','Pakke-Kessang','Papum Pare','Kurung Kumey','Kra Daadi','Lower Subansiri','Upper Subansiri','West Siang','Lepa Rada','Lower Siang','Upper Siang','East Siang','Siang','Upper Dibang Valley','Lower Dibang Valley','Lohit','Namsai','Anjaw','Changlang','Tirap','Longding','Itanagar Capital Complex','Kamle','Shi-Yomi'
    ]},
    { name: 'Assam', districts: [
      'Bajali','Baksa','Barpeta','Biswanath','Bongaigaon','Cachar','Charaideo','Chirang','Darrang','Dhemaji','Dhubri','Dibrugarh','Goalpara','Golaghat','Hailakandi','Hojai','Jorhat','Kamrup','Kamrup Metropolitan','Karbi Anglong','Karimganj','Kokrajhar','Lakhimpur','Majuli','Morigaon','Nagaon','Nalbari','Sivasagar','Sonitpur','South Salmara-Mankachar','Tinsukia','Udalguri','West Karbi Anglong','Tamulpur'
    ]},
    { name: 'Bihar', districts: [
      'Araria','Arwal','Aurangabad','Banka','Begusarai','Bhagalpur','Bhojpur','Buxar','Darbhanga','East Champaran','Gaya','Gopalganj','Jamui','Jehanabad','Kaimur','Katihar','Khagaria','Kishanganj','Lakhisarai','Madhepura','Madhubani','Munger','Muzaffarpur','Nalanda','Nawada','Patna','Purnea','Rohtas','Saharsa','Samastipur','Saran','Sheikhpura','Sheohar','Sitamarhi','Siwan','Supaul','Vaishali','West Champaran'
    ]},
    { name: 'Chhattisgarh', districts: [
      'Balod','Baloda Bazar','Balrampur','Bastar','Bemetara','Bijapur','Bilaspur','Dantewada','Dhamtari','Durg','Gariaband','Gaurella-Pendra-Marwahi','Janjgir-Champa','Jashpur','Kabirdham','Kanker','Khairagarh-Chhuikhadan-Gandai','Kondagaon','Korba','Koriya','Mahasamund','Manendragarh-Chirmiri-Bharatpur','Mungeli','Narayanpur','Raigarh','Raipur','Rajnandgaon','Sukma','Surajpur','Surguja'
    ]},
    { name: 'Goa', districts: ['North Goa','South Goa'] },
    { name: 'Gujarat', districts: [
      'Ahmedabad','Amreli','Anand','Aravalli','Banaskantha','Bharuch','Bhavnagar','Botad','Chhota Udaipur','Dahod','Dang','Devbhoomi Dwarka','Gandhinagar','Gir Somnath','Jamnagar','Junagadh','Kheda','Kutch','Mahisagar','Mehsana','Morbi','Narmada','Navsari','Panchmahal','Patan','Porbandar','Rajkot','Sabarkantha','Surat','Surendranagar','Tapi','Vadodara','Valsad'
    ]},
    { name: 'Haryana', districts: [
      'Ambala','Bhiwani','Charkhi Dadri','Faridabad','Fatehabad','Gurugram','Hisar','Jhajjar','Jind','Kaithal','Karnal','Kurukshetra','Mahendragarh','Nuh','Palwal','Panchkula','Panipat','Rewari','Rohtak','Sirsa','Sonipat','Yamunanagar'
    ]},
    { name: 'Himachal Pradesh', districts: [
      'Bilaspur','Chamba','Hamirpur','Kangra','Kinnaur','Kullu','Lahaul and Spiti','Mandi','Shimla','Sirmaur','Solan','Una'
    ]},
    { name: 'Jharkhand', districts: [
      'Bokaro','Chatra','Deoghar','Dhanbad','Dumka','East Singhbhum','Garhwa','Giridih','Godda','Gumla','Hazaribagh','Jamtara','Khunti','Koderma','Latehar','Lohardaga','Pakur','Palamu','Ramgarh','Ranchi','Sahebganj','Saraikela-Kharsawan','Simdega','West Singhbhum'
    ]},
    { name: 'Karnataka', districts: [
      'Bagalkot','Ballari','Belagavi','Bengaluru Rural','Bengaluru Urban','Bidar','Chamarajanagar','Chikballapur','Chikkamagaluru','Chitradurga','Dakshina Kannada','Davanagere','Dharwad','Gadag','Hassan','Haveri','Kalaburagi','Kodagu','Kolar','Koppal','Mandya','Mysuru','Raichur','Ramanagara','Shivamogga','Tumakuru','Udupi','Uttara Kannada','Vijayapura','Yadgir','Vijayanagara'
    ]},
    { name: 'Kerala', districts: [
      'Alappuzha','Ernakulam','Idukki','Kannur','Kasargod','Kollam','Kottayam','Kozhikode','Malappuram','Palakkad','Pathanamthitta','Thiruvananthapuram','Thrissur','Wayanad'
    ]},
    { name: 'Madhya Pradesh', districts: [
      'Agar Malwa','Alirajpur','Anuppur','Ashoknagar','Balaghat','Barwani','Betul','Bhind','Bhopal','Burhanpur','Chhatarpur','Chhindwara','Damoh','Datia','Dewas','Dhar','Dindori','Guna','Gwalior','Harda','Hoshangabad','Indore','Jabalpur','Jhabua','Katni','Khandwa','Khargone','Mandla','Mandsaur','Morena','Narsinghpur','Neemuch','Niwari','Panna','Raisen','Rajgarh','Ratlam','Rewa','Sagar','Satna','Sehore','Seoni','Shahdol','Shajapur','Sheopur','Shivpuri','Sidhi','Singrauli','Tikamgarh','Ujjain','Umaria','Vidisha'
    ]},
    { name: 'Maharashtra', districts: [
      'Ahmednagar','Akola','Amravati','Aurangabad','Beed','Bhandara','Buldhana','Chandrapur','Dhule','Gadchiroli','Gondia','Hingoli','Jalgaon','Jalna','Kolhapur','Latur','Mumbai City','Mumbai Suburban','Nagpur','Nanded','Nandurbar','Nashik','Osmanabad','Palghar','Parbhani','Pune','Raigad','Ratnagiri','Sangli','Satara','Sindhudurg','Solapur','Thane','Wardha','Washim','Yavatmal'
    ]},
    { name: 'Manipur', districts: [
      'Bishnupur','Chandel','Churachandpur','Imphal East','Imphal West','Jiribam','Kakching','Kamjong','Kangpokpi','Noney','Pherzawl','Senapati','Tamenglong','Tengnoupal','Thoubal','Ukhrul'
    ]},
    { name: 'Meghalaya', districts: [
      'East Garo Hills','West Garo Hills','South Garo Hills','South West Garo Hills','North Garo Hills','East Khasi Hills','West Khasi Hills','South West Khasi Hills','Ri-Bhoi','Eastern West Khasi Hills','West Jaintia Hills','East Jaintia Hills'
    ]},
    { name: 'Mizoram', districts: [
      'Aizawl','Champhai','Kolasib','Lawngtlai','Lunglei','Mamit','Saiha','Serchhip','Hnahthial','Khawzawl','Saitual'
    ]},
    { name: 'Nagaland', districts: [
      'Chümoukedima','Dimapur','Kiphire','Kohima','Longleng','Mokokchung','Mon','Niuland','Noklak','Peren','Phek','Tuensang','Tseminyü','Wokha','Zünheboto'
    ]},
    { name: 'Odisha', districts: [
      'Angul','Balangir','Balasore','Bargarh','Bhadrak','Boudh','Cuttack','Deogarh','Dhenkanal','Gajapati','Ganjam','Jagatsinghpur','Jajpur','Jharsuguda','Kalahandi','Kandhamal','Kendrapara','Kendujhar','Khordha','Koraput','Malkangiri','Mayurbhanj','Nabarangpur','Nayagarh','Nuapada','Puri','Rayagada','Sambalpur','Subarnapur','Sundargarh'
    ]},
    { name: 'Punjab', districts: [
      'Amritsar','Barnala','Bathinda','Faridkot','Fatehgarh Sahib','Ferozepur','Fazilka','Gurdaspur','Hoshiarpur','Jalandhar','Kapurthala','Ludhiana','Mansa','Moga','Muktsar','Pathankot','Patiala','Rupnagar','Sahibzada Ajit Singh Nagar','Sangrur','Shahid Bhagat Singh Nagar','Tarn Taran','Malerkotla'
    ]},
    { name: 'Rajasthan', districts: [
      'Ajmer','Alwar','Balotra','Banswara','Baran','Barmer','Beawar','Bharatpur','Bhilwara','Bikaner','Bundi','Chittorgarh','Churu','Dausa','Deeg','Dholpur','Didwana-Kuchaman','Dudu','Dungarpur','Ganganagar','Hanumangarh','Jaipur','Jaipur Rural','Jaisalmer','Jalore','Jhalawar','Jhunjhunu','Jodhpur','Jodhpur Rural','Karauli','Kekri','Kota','Lalsot','Nagaur','Neem Ka Thana','Pali','Phalodi','Pratapgarh','Rajsamand','Sanchore','Sawai Madhopur','Shahpura','Sikar','Sirohi','Tonk','Udaipur'
    ]},
    { name: 'Sikkim', districts: [
      'Gangtok','Gyalshing','Namchi','Mangan','Pakyong','Soreng'
    ]},
    { name: 'Tamil Nadu', districts: [
      'Ariyalur','Chengalpattu','Chennai','Coimbatore','Cuddalore','Dharmapuri','Dindigul','Erode','Kallakurichi','Kanchipuram','Kanyakumari','Karur','Krishnagiri','Madurai','Mayiladuthurai','Nagapattinam','Namakkal','Nilgiris','Perambalur','Pudukkottai','Ramanathapuram','Ranipet','Salem','Sivaganga','Tenkasi','Thanjavur','Theni','Thoothukudi','Tiruchirappalli','Tirunelveli','Tirupathur','Tiruppur','Tiruvallur','Tiruvannamalai','Tiruvarur','Vellore','Viluppuram','Virudhunagar'
    ]},
    { name: 'Telangana', districts: [
      'Adilabad','Bhadradri Kothagudem','Hanumakonda','Hyderabad','Jagtial','Jangoan','Jayashankar Bhupalpally','Jogulamba Gadwal','Kamareddy','Karimnagar','Khammam','Komaram Bheem Asifabad','Mahabubabad','Mahbubnagar','Mancherial','Medak','Medchal-Malkajgiri','Mulugu','Nagarkurnool','Nalgonda','Narayanpet','Nirmal','Nizamabad','Peddapalli','Rajanna Sircilla','Rangareddy','Sangareddy','Siddipet','Suryapet','Vikarabad','Wanaparthy','Warangal','Yadadri Bhuvanagiri'
    ]},
    { name: 'Tripura', districts: [
      'Dhalai','Gomati','Khowai','North Tripura','Sipahijala','South Tripura','Unakoti','West Tripura'
    ]},
    { name: 'Uttar Pradesh', districts: [
      'Agra','Aligarh','Ambedkar Nagar','Amethi','Amroha','Auraiya','Ayodhya','Azamgarh','Badaun','Baghpat','Bahraich','Ballia','Balrampur','Banda','Barabanki','Bareilly','Basti','Bhadohi','Bijnor','Budaun','Bulandshahr','Chandauli','Chitrakoot','Deoria','Etah','Etawah','Farrukhabad','Fatehpur','Firozabad','Gautam Buddha Nagar','Ghaziabad','Ghazipur','Gonda','Gorakhpur','Hamirpur','Hapur','Hardoi','Hathras','Jalaun','Jaunpur','Jhansi','Kannauj','Kanpur Dehat','Kanpur Nagar','Kasganj','Kaushambi','Kheri','Kushinagar','Lalitpur','Lucknow','Maharajganj','Mahoba','Mainpuri','Mathura','Mau','Meerut','Mirzapur','Moradabad','Muzaffarnagar','Pilibhit','Pratapgarh','Prayagraj','Rae Bareli','Rampur','Saharanpur','Sambhal','Sant Kabir Nagar','Shahjahanpur','Shamli','Shravasti','Siddharthnagar','Sitapur','Sonbhadra','Sultanpur','Unnao','Varanasi'
    ]},
    { name: 'Uttarakhand', districts: [
      'Almora','Bageshwar','Chamoli','Champawat','Dehradun','Haridwar','Nainital','Pauri Garhwal','Pithoragarh','Rudraprayag','Tehri Garhwal','Udham Singh Nagar','Uttarkashi'
    ]},
    { name: 'West Bengal', districts: [
      'Alipurduar','Bankura','Birbhum','Cooch Behar','Dakshin Dinajpur','Darjeeling','Hooghly','Howrah','Jalpaiguri','Jhargram','Kalimpong','Kolkata','Malda','Murshidabad','Nadia','North 24 Parganas','Paschim Bardhaman','Paschim Medinipur','Purba Bardhaman','Purba Medinipur','Purulia','South 24 Parganas','Uttar Dinajpur'
    ]},
    { name: 'Andaman and Nicobar Islands (UT)', districts: [
      'Nicobar','North and Middle Andaman','South Andaman'
    ]}
    ,
    { name: 'Chandigarh', districts: [
      'Chandigarh'
    ]},
    { name: 'Dadra and Nagar Haveli and Daman and Diu', districts: [
      'Dadra and Nagar Haveli','Daman','Diu'
    ]},
    { name: 'Delhi (NCT)', districts: [
      'Central Delhi','East Delhi','New Delhi','North Delhi','North East Delhi','North West Delhi','Shahdara','South Delhi','South East Delhi','South West Delhi','West Delhi'
    ]},
    { name: 'Jammu and Kashmir', districts: [
      'Anantnag','Bandipora','Baramulla','Budgam','Doda','Ganderbal','Jammu','Kathua','Kishtwar','Kulgam','Kupwara','Poonch','Pulwama','Rajouri','Ramban','Reasi','Samba','Shopian','Srinagar','Udhampur'
    ]},
    { name: 'Ladakh', districts: [
      'Kargil','Leh'
    ]},
    { name: 'Lakshadweep', districts: [
      'Agatti','Amini','Andrott','Bitra','Chetlat','Kadmat','Kalpeni','Kavaratti','Minicoy'
    ]},
    { name: 'Puducherry', districts: [
      'Karaikal','Mahe','Puducherry','Yanam'
    ]}
    // Add more states/UTs here if you have the data ready
  ];

  // Insert states and districts from the mapping if they don't exist
  for (const s of statesWithDistricts) {
    let dbState = await prisma.states.findUnique({ where: { name: s.name } });
    if (!dbState) {
      try {
        dbState = await prisma.states.create({ data: { name: s.name } });
        console.log(`Created state: ${s.name}`);
      } catch (error) {
        console.error(`Error creating state ${s.name}:`, error);
        continue;
      }
    }

    for (const dname of s.districts) {
      const dbDistrict = await prisma.districts.findUnique({ where: { name: dname } });
      if (!dbDistrict) {
        try {
          await prisma.districts.create({ data: { name: dname, stateId: dbState.id } });
          console.log(`Created district: ${dname} in state: ${s.name}`);
        } catch (error) {
          console.error(`Error creating district ${dname} for state ${s.name}:`, error);
        }
      }
    }
  }

  // Ensure `state` and `district` variables still reference Telangana and Hyderabad
  let state = await prisma.states.findUnique({ where: { name: 'Telangana' } });
  if (!state) {
    state = await prisma.states.create({ data: { name: 'Telangana' } });
    console.log('Created fallback state: Telangana');
  }

  let district = await prisma.districts.findUnique({ where: { name: 'Hyderabad' } });
  if (!district) {
    if (!state) {
      console.error('State not found. Cannot create district.');
      return;
    }

    district = await prisma.districts.create({ data: { name: 'Hyderabad', stateId: state.id } });
    console.log(`Created district: Hyderabad in state: ${state.name}`);
  }

  console.log('Seeding zones...');
  // Seed zones for Hyderabad district using dynamic district ID
  const zonesToSeed = [
    { name: "Central Zone", districtName: "Hyderabad" },
    { name: "East Zone", districtName: "Hyderabad" },
    { name: "North Zone", districtName: "Hyderabad" },
    { name: "South East Zone", districtName: "Hyderabad" },
    { name: "South West Zone", districtName: "Hyderabad" },
    { name: "South Zone", districtName: "Hyderabad" },
    { name: "West Zone", districtName: "Hyderabad" },
  ];

  for (const zone of zonesToSeed) {
    // Check if zone already exists
    const existingZone = await prisma.zones.findUnique({ where: { name: zone.name } });
    if (existingZone) {
      console.log(`Zone '${zone.name}' already exists. Skipping.`);
      continue;
    }

    // Get the actual district ID
    const targetDistrict = await prisma.districts.findUnique({ where: { name: zone.districtName } });
    if (!targetDistrict) {
      console.error(`District '${zone.districtName}' not found for zone '${zone.name}'. Skipping.`);
      continue;
    }

    try {
      await prisma.zones.create({
        data: {
          name: zone.name,
          districtId: targetDistrict.id,
        },
      });
      console.log(`Created zone: ${zone.name} in district: ${zone.districtName}`);
    } catch (error) {
      console.error(`Error creating zone ${zone.name}:`, error);
    }
  }

  console.log('Seeding divisions...');

  // Fetch zones from database to get actual IDs
  const zonesFromDb = await prisma.zones.findMany();
  const zoneMap: Record<string, number> = {};
  zonesFromDb.forEach(zone => {
    zoneMap[zone.name] = zone.id;
  });

  // Seed divisions with dynamic zone mapping
  const divisionsToSeed = [
    // Central Zone
    { name: "Abids", zoneName: "Central Zone" },
    { name: "Chikkadpally", zoneName: "Central Zone" },
    { name: "Gandhinagar", zoneName: "Central Zone" },
    { name: "Saifabad", zoneName: "Central Zone" },
    // East Zone
    { name: "Kachiguda", zoneName: "East Zone" },
    { name: "Chilkalguda", zoneName: "East Zone" },
    { name: "Osmania University", zoneName: "East Zone" },
    { name: "Sultan Bazar", zoneName: "East Zone" },
    // North Zone
    { name: "Begumpet", zoneName: "North Zone" },
    { name: "Gopalpuram", zoneName: "North Zone" },
    { name: "Mahankali", zoneName: "North Zone" },
    { name: "Trimulgherry", zoneName: "North Zone" },
    // South East Zone
    { name: "Chandrayangutta", zoneName: "South East Zone" },
    { name: "Santosh Nagar", zoneName: "South East Zone" },
    { name: "Saidabad", zoneName: "South East Zone" },
    { name: "Malakpet", zoneName: "South East Zone" },
    // South West Zone
    { name: "Asif Nagar", zoneName: "South West Zone" },
    { name: "Goshamahal", zoneName: "South West Zone" },
    { name: "Golconda", zoneName: "South West Zone" },
    { name: "Kulsumpura", zoneName: "South West Zone" },
    // South Zone
    { name: "Charminar", zoneName: "South Zone" },
    { name: "Falaknuma", zoneName: "South Zone" },
    { name: "Chatrinaka", zoneName: "South Zone" },
    { name: "Mirchowk", zoneName: "South Zone" },
    // West Zone
    { name: "Banjara Hills", zoneName: "West Zone" },
    { name: "Jubilee Hills", zoneName: "West Zone" },
    { name: "Panjagutta", zoneName: "West Zone" },
    { name: "SR Nagar", zoneName: "West Zone" }
  ];

  for (const division of divisionsToSeed) {
    // Check if division already exists
    const existingDivision = await prisma.divisions.findUnique({ where: { name: division.name } });
    if (existingDivision) {
      console.log(`Division '${division.name}' already exists. Skipping.`);
      continue;
    }

    // Get the actual zone ID from the zone map
    const zoneId = zoneMap[division.zoneName];
    if (!zoneId) {
      console.error(`Zone '${division.zoneName}' not found for division '${division.name}'. Skipping.`);
      continue;
    }

    try {
      await prisma.divisions.create({
        data: {
          name: division.name,
          zoneId: zoneId,
        },
      });
      console.log(`Created division: ${division.name} in zone: ${division.zoneName}`);
    } catch (error) {
      console.error(`Error creating division ${division.name}:`, error);
    }
  }

  console.log('Seeding police stations...');

  // Fetch divisions from database to get actual IDs
  const divisionsFromDb = await prisma.divisions.findMany();
  const divisionMap: Record<string, number> = {};
  divisionsFromDb.forEach(division => {
    divisionMap[division.name] = division.id;
  });

  // Seed police stations with dynamic division mapping
  const policeStationsToSeed = [
    // Central Zone - Abids Division
    { name: "Abids Road PS", divisionName: "Abids" },
    { name: "Begum Bazar PS", divisionName: "Abids" },
    // Central Zone - Chikkadpally Division
    { name: "Chikkadapally PS", divisionName: "Chikkadpally" },
    { name: "Musheerabad PS", divisionName: "Chikkadpally" },
    // Central Zone - Gandhinagar Division
    { name: "Gandhi Nagar PS", divisionName: "Gandhinagar" },
    { name: "DOMALGUDA PS", divisionName: "Gandhinagar" },
    { name: "SECRETARIAT PS", divisionName: "Gandhinagar" },
    // Central Zone - Saifabad Division
    { name: "Saifabad PS", divisionName: "Saifabad" },
    { name: "Nampally PS", divisionName: "Saifabad" },
    { name: "KHAIRATABAD PS", divisionName: "Saifabad" },

    // East Zone - Kachiguda Division
    { name: "Amberpet PS", divisionName: "Kachiguda" },
    { name: "Kachiguda PS", divisionName: "Kachiguda" },
    // East Zone - Chilkalguda Division
    { name: "Lalaguda PS", divisionName: "Chilkalguda" },
    { name: "Chilkalguda PS", divisionName: "Chilkalguda" },
    { name: "WARASIGUDA PS", divisionName: "Chilkalguda" },
    // East Zone - Osmania University Division
    { name: "Osmania University PS", divisionName: "Osmania University" },
    { name: "Nallakunta PS", divisionName: "Osmania University" },
    // East Zone - Sultan Bazar Division
    { name: "Sultan Bazar PS", divisionName: "Sultan Bazar" },
    { name: "Afzal Gunj PS", divisionName: "Sultan Bazar" },
    { name: "Narayanaguda PS", divisionName: "Sultan Bazar" },

    // North Zone - Begumpet Division
    { name: "Begumpet PS", divisionName: "Begumpet" },
    { name: "Bowenpally PS", divisionName: "Begumpet" },
    // North Zone - Gopalpuram Division
    { name: "Gopalpuram PS", divisionName: "Gopalpuram" },
    { name: "Tukaramgate PS", divisionName: "Gopalpuram" },
    { name: "Marredpally PS", divisionName: "Gopalpuram" },
    // North Zone - Mahankali Division
    { name: "Ramgopalpet PS", divisionName: "Mahankali" },
    { name: "Mahankali PS", divisionName: "Mahankali" },
    { name: "Market PS", divisionName: "Mahankali" },
    // North Zone - Trimulgherry Division
    { name: "Bollarum PS", divisionName: "Trimulgherry" },
    { name: "Trimulgherry PS", divisionName: "Trimulgherry" },
    { name: "Karkhana PS", divisionName: "Trimulgherry" },

    // South East Zone - Chandrayangutta Division
    { name: "Chandrayangutta PS", divisionName: "Chandrayangutta" },
    { name: "BANDLAGUDA PS", divisionName: "Chandrayangutta" },
    { name: "Kanchanbagh PS", divisionName: "Chandrayangutta" },
    // South East Zone - Santosh Nagar Division
    { name: "Santosh Nagar PS", divisionName: "Santosh Nagar" },
    { name: "I S SADAN PS", divisionName: "Santosh Nagar" },
    // South East Zone - Saidabad Division
    { name: "Madannapet PS", divisionName: "Saidabad" },
    { name: "Saidabad PS", divisionName: "Saidabad" },
    // South East Zone - Malakpet Division
    { name: "Malakpet PS", divisionName: "Malakpet" },
    { name: "Chaderghat PS", divisionName: "Malakpet" },
    { name: "Dabeerpura PS", divisionName: "Malakpet" },

    // South West Zone - Asif Nagar Division
    { name: "Asif Nagar PS", divisionName: "Asif Nagar" },
    { name: "Humayun Nagar PS", divisionName: "Asif Nagar" },
    { name: "Habeeb Nagar PS", divisionName: "Asif Nagar" },
    // South West Zone - Goshamahal Division
    { name: "Shahinayathgunj PS", divisionName: "Goshamahal" },
    { name: "Mangalhat PS", divisionName: "Goshamahal" },
    // South West Zone - Golconda Division
    { name: "Golconda PS", divisionName: "Golconda" },
    { name: "Langar House PS", divisionName: "Golconda" },
    // South West Zone - Kulsumpura Division
    { name: "GUDIMALKAPUR PS", divisionName: "Kulsumpura" },
    { name: "Kulsumpura PS", divisionName: "Kulsumpura" },
    { name: "Tapachabutra PS", divisionName: "Kulsumpura" },

    // South Zone - Charminar Division
    { name: "Charminar PS", divisionName: "Charminar" },
    { name: "Kamatipura PS", divisionName: "Charminar" },
    { name: "Hussainialam PS", divisionName: "Charminar" },
    // South Zone - Falaknuma Division
    { name: "Falaknuma PS", divisionName: "Falaknuma" },
    { name: "Bahadurpura PS", divisionName: "Falaknuma" },
    { name: "Kalapathar PS", divisionName: "Falaknuma" },
    // South Zone - Chatrinaka Division
    { name: "Moghalpura PS", divisionName: "Chatrinaka" },
    { name: "Chatrinaka PS", divisionName: "Chatrinaka" },
    { name: "Shalibanda PS", divisionName: "Chatrinaka" },
    // South Zone - Mirchowk Division
    { name: "Mirchowk PS", divisionName: "Mirchowk" },
    { name: "Bhavaninagar PS", divisionName: "Mirchowk" },
    { name: "Rein Bazar PS", divisionName: "Mirchowk" },

    // West Zone - Banjara Hills Division
    { name: "Banjara Hills PS", divisionName: "Banjara Hills" },
    { name: "MASAB TANK PS", divisionName: "Banjara Hills" },
    // West Zone - Jubilee Hills Division
    { name: "Jubilee Hills PS", divisionName: "Jubilee Hills" },
    { name: "FILM NAGAR PS", divisionName: "Jubilee Hills" },
    // West Zone - Panjagutta Division
    { name: "Panjagutta PS", divisionName: "Panjagutta" },
    { name: "MADHURA NAGAR PS", divisionName: "Panjagutta" },
    // West Zone - SR Nagar Division
    { name: "S.R. Nagar PS", divisionName: "SR Nagar" },
    { name: "BORABANDA PS", divisionName: "SR Nagar" }
  ];

  for (const policeStation of policeStationsToSeed) {
    // Check if police station already exists
    const existingPoliceStation = await prisma.policeStations.findUnique({ where: { name: policeStation.name } });
    if (existingPoliceStation) {
      console.log(`Police Station '${policeStation.name}' already exists. Skipping.`);
      continue;
    }

    // Get the actual division ID from the division map
    const divisionId = divisionMap[policeStation.divisionName];
    if (!divisionId) {
      console.error(`Division '${policeStation.divisionName}' not found for police station '${policeStation.name}'. Skipping.`);
      continue;
    }

    try {
      await prisma.policeStations.create({
        data: {
          name: policeStation.name,
          divisionId: divisionId,
        },
      });
      console.log(`Created police station: ${policeStation.name} in division: ${policeStation.divisionName}`);
    } catch (error) {
      console.error(`Error creating police station ${policeStation.name}:`, error);
    }
  }

  // Fetch police stations, zones, divisions
  const policeStations = await prisma.policeStations.findMany();
  const zones = await prisma.zones.findMany();
  const divisions = await prisma.divisions.findMany();

  // Helper: get first available ID from each table
  const policeStationId = policeStations.length > 0 ? policeStations[0].id : undefined;
  const zonalId = zones.length > 0 ? zones[0].id : undefined;
  const divisionId = divisions.length > 0 ? divisions[0].id : undefined;

  console.log('Seeding users...');

  // Test creating a simple user first
  try {
    console.log('Testing simple user creation...');
    await prisma.users.create({
      data: {
        username: 'test_user',
        email: 'test@example.com',
        password: await hashPassword('password'), // Hash the password
        phoneNo: '1234567890',
        roleId: dbRoles[0].id, // Use the first role's ID
      },
    });
    console.log('Simple user created successfully');

    // Delete the test user (use deleteMany since username is not a unique field in Prisma schema)
    await prisma.users.deleteMany({ where: { username: 'test_user' } });
    console.log('Test user deleted');
  } catch (error) {
    console.error('Error creating simple test user:', error);
    return; // Exit early if we can't even create a simple user
  }

  // Helper function to generate state code from state name
  const generateStateCode = (stateName: string): string => {
    // Extract first letters of each word or use initials for well-known abbreviations
    const stateAbbreviations: Record<string, string> = {
      'Andhra Pradesh': 'AP',
      'Arunachal Pradesh': 'AR',
      'Assam': 'AS',
      'Bihar': 'BR',
      'Chhattisgarh': 'CG',
      'Goa': 'GA',
      'Gujarat': 'GJ',
      'Haryana': 'HR',
      'Himachal Pradesh': 'HP',
      'Jharkhand': 'JH',
      'Karnataka': 'KA',
      'Kerala': 'KL',
      'Madhya Pradesh': 'MP',
      'Maharashtra': 'MH',
      'Manipur': 'MN',
      'Meghalaya': 'ML',
      'Mizoram': 'MZ',
      'Nagaland': 'NL',
      'Odisha': 'OD',
      'Punjab': 'PB',
      'Rajasthan': 'RJ',
      'Sikkim': 'SK',
      'Tamil Nadu': 'TN',
      'Telangana': 'TG',
      'Tripura': 'TR',
      'Uttar Pradesh': 'UP',
      'Uttarakhand': 'UT',
      'West Bengal': 'WB',
      'Andaman and Nicobar Islands (UT)': 'AN',
      'Chandigarh': 'CH',
      'Dadra and Nagar Haveli and Daman and Diu': 'DD',
      'Delhi (NCT)': 'DL',
      'Jammu and Kashmir': 'JK',
      'Ladakh': 'LD',
      'Lakshadweep': 'LS',
      'Puducherry': 'PY'
    };
    return stateAbbreviations[stateName] || stateName.substring(0, 2).toUpperCase();
  };

  // Create state-level ADMIN users
  const stateAdminUsers: any[] = [];
  const allStates = await prisma.states.findMany();
  
  for (let i = 0; i < allStates.length; i++) {
    const stateRecord = allStates[i];
    const stateCode = generateStateCode(stateRecord.name);
    stateAdminUsers.push({
      username: `${stateCode}_ADMIN_ALMS`,
      email: `admin-${stateRecord.name.toLowerCase().replace(/\s+/g, '-')}@tspolice.gov.in`,
      password: 'password',
      phoneNo: `8712670${String(1000 + i).padStart(3, '0')}`,
      role: 'ADMIN',
      stateId: stateRecord.id,
    });
  }

  // Create location-based users with proper hierarchy mapping
  const locationUsers: any[] = [];
  let phoneCounter = 1000; // Counter to ensure unique phone numbers

  // Zone-level users (DCP role)
  const zonesForUsers = await prisma.zones.findMany();
  for (const zone of zonesForUsers) {
    const zoneShortForm = zone.name.replace(/\s+/g, '').substring(0, 3).toUpperCase(); // e.g., "Central Zone" -> "CEN"
    locationUsers.push({
      username: `DCP_${zoneShortForm}_HYD`,
      email: `dcp-${zone.name.toLowerCase().replace(/\s+/g, '-')}@tspolice.gov.in`,
      password: 'password',
      phoneNo: `8712661${String(phoneCounter++).padStart(5, '0')}`, // Unique phone numbers
      role: 'DCP',
      stateId: state ? state.id : undefined,
      districtId: district ? district.id : undefined,
      zoneId: zone.id
    });
  }

  // Division-level users (ACP role)
  const divisionsForUsers = await prisma.divisions.findMany({ include: { zone: true } });
  for (const division of divisionsForUsers) {
    const divisionShortForm = division.name.replace(/\s+/g, '').substring(0, 3).toUpperCase(); // e.g., "Abids" -> "ABI"
    locationUsers.push({
      username: `ACP_${divisionShortForm}_HYD`,
      email: `acp-${division.name.toLowerCase().replace(/\s+/g, '-')}@tspolice.gov.in`,
      password: 'password',
      phoneNo: `8712662${String(phoneCounter++).padStart(5, '0')}`, // Unique phone numbers
      role: 'ACP',
      stateId: state ? state.id : undefined,
      districtId: district ? district.id : undefined,
      zoneId: division.zoneId,
      divisionId: division.id
    });
  }

  // Police Station-level users (SHO role)
  const policeStationsForUsers = await prisma.policeStations.findMany({
    include: {
      division: { include: { zone: true } }
    }
  });
  for (const policeStation of policeStationsForUsers) {
    // Create short form from police station name (remove "PS" and spaces)
    const psShortForm = policeStation.name
      .replace(/\s+PS$/i, '')
      .replace(/\s+/g, '')
      .substring(0, 4)
      .toUpperCase(); // e.g., "Abids Road PS" -> "ABID"

    locationUsers.push({
      username: `SHO_${psShortForm}_HYD`,
      email: `sho-${policeStation.name.toLowerCase().replace(/\s+/g, '-').replace('-ps', '')}@tspolice.gov.in`,
      password: 'password',
      phoneNo: `8712663${String(phoneCounter++).padStart(5, '0')}`, // Unique phone numbers
      role: 'SHO',
      stateId: state ? state.id : undefined,
      districtId: district ? district.id : undefined,
      zoneId: policeStation.division?.zoneId,
      divisionId: policeStation.divisionId,
      policeStationId: policeStation.id
    });
  }

  // Users array and creation loop - keep existing admin users + add state admin users + location users
  const users: any[] = [
    // Existing administrative users
    {
      username: 'CADO_HYD',
      email: 'cado-admin-hyd@tspolice.gov.in',
      password: 'password',
      phoneNo: '8712660022',
      role: 'CADO',
      stateId: state ? state.id : undefined,
      districtId: district ? district.id : undefined
    },
    {
      username: 'JTCP_ADMIN',
      email: 'jtcp-admnhyd@tspolice.gov.in',
      password: 'password',
      phoneNo: '8712660798',
      role: 'JTCP',
      stateId: state ? state.id : undefined,
      districtId: district ? district.id : undefined
    },
    {
      username: 'CP_HYD',
      email: 'cp-hyderabad@tspolice.gov.in',
      password: 'password',
      phoneNo: '8712660799',
      role: 'CP',
      stateId: state ? state.id : undefined,
      districtId: district ? district.id : undefined
    },
    {
      username: 'ADMIN_USER',
      email: 'admin@tspolice.gov.in',
      password: 'password',
      phoneNo: '8712660404',
      role: 'ADMIN',
      stateId: state ? state.id : undefined,
      districtId: district ? district.id : undefined
    },
    // Add all state-level ADMIN users
    ...stateAdminUsers,
    // ZS - Zonal Superintendents for each zone
    {
      username: 'SUPDT_NZ_HYD',
      email: 'supdt-north-zone@tspolice.gov.in',
      password: 'password',
      phoneNo: '8712660501',
      role: 'ZS',
      stateId: state ? state.id : undefined,
      districtId: district ? district.id : undefined,
      zoneId: zoneMap['North Zone']
    },
    {
      username: 'SUPDT_CZ_HYD',
      email: 'supdt-central-zone@tspolice.gov.in',
      password: 'password',
      phoneNo: '8712660502',
      role: 'ZS',
      stateId: state ? state.id : undefined,
      districtId: district ? district.id : undefined,
      zoneId: zoneMap['Central Zone']
    },
    {
      username: 'SUPDT_SZ_HYD',
      email: 'supdt-south-zone@tspolice.gov.in',
      password: 'password',
      phoneNo: '8712660503',
      role: 'ZS',
      stateId: state ? state.id : undefined,
      districtId: district ? district.id : undefined,
      zoneId: zoneMap['South Zone']
    },
    {
      username: 'SUPDT_WZ_HYD',
      email: 'supdt-west-zone@tspolice.gov.in',
      password: 'password',
      phoneNo: '8712660504',
      role: 'ZS',
      stateId: state ? state.id : undefined,
      districtId: district ? district.id : undefined,
      zoneId: zoneMap['West Zone']
    },
    {
      username: 'SUPDT_EZ_HYD',
      email: 'supdt-east-zone@tspolice.gov.in',
      password: 'password',
      phoneNo: '8712660505',
      role: 'ZS',
      stateId: state ? state.id : undefined,
      districtId: district ? district.id : undefined,
      zoneId: zonalId ? zonalId : undefined,
    },
    {
      username: 'SUPDT_SWZ_HYD',
      email: 'supdt-south-west-zone@tspolice.gov.in',
      password: 'password',
      phoneNo: '8712660506',
      role: 'ZS',
      stateId: state ? state.id : undefined,
      districtId: district ? district.id : undefined,
      zoneId: zoneMap['South West Zone']
    },
    {
      username: 'SUPDT_SEZ_HYD',
      email: 'supdt-south-east-zone@tspolice.gov.in',
      password: 'password',
      phoneNo: '8712660507',
      role: 'ZS',
      stateId: state ? state.id : undefined,
      districtId: district ? district.id : undefined,
      zoneId: zoneMap['South East Zone']
    },
    {
      username: 'SHO_BEGU_HYD',
      email: 'sho-begumpet@tspolice.gov.in',
      password: 'password',
      phoneNo: '8733660001',
      role: 'SHO',
      stateId: state ? state.id : undefined,
      districtId: district ? district.id : undefined,
      // Will be linked to Begumpet division and police station via dynamic lookup
    },
    {
      username: 'ARMS_SUPDT_HYD',
      email: 'arms-superintendent@tspolice.gov.in',
      password: 'password',
      phoneNo: '8712660301',
      role: 'AS',
      stateId: state ? state.id : undefined,
      districtId: district ? district.id : undefined
    },
    {
      username: 'ARMS_SEAT_A1_HYD',
      email: 'arms-seat-a1@tspolice.gov.in',
      password: 'password',
      phoneNo: '8712660302',
      role: 'AS',
      stateId: state ? state.id : undefined,
      districtId: district ? district.id : undefined
    },
    {
      username: 'ARMS_SEAT_A2_HYD',
      email: 'arms-seat-a2@tspolice.gov.in',
      password: 'password',
      phoneNo: '8712660303',
      role: 'AS',
      stateId: state ? state.id : undefined,
      districtId: district ? district.id : undefined
    },
    {
      username: 'ARMS_SEAT_A3_HYD',
      email: 'arms-seat-a3@tspolice.gov.in',
      password: 'password',
      phoneNo: '8712660304',
      role: 'AS',
      stateId: state ? state.id : undefined,
      districtId: district ? district.id : undefined
    },
    {
      username: 'ARMS_SEAT_A4_HYD',
      email: 'arms-seat-a4@tspolice.gov.in',
      password: 'password',
      phoneNo: '8712660305',
      role: 'AS',
      stateId: state ? state.id : undefined,
      districtId: district ? district.id : undefined
    },
    {
      username: 'ADO_HYD',
      email: 'ado-hyderabad@tspolice.gov.in',
      password: 'password',
      phoneNo: '8712660306',
      role: 'ADO',
      stateId: state ? state.id : undefined,
      districtId: district ? district.id : undefined
    },
    // Add all location-based users
    ...locationUsers
  ];

  for (const user of users) {
    if (!roleMap[user.role]) {
      console.warn(`Role '${user.role}' not found for user '${user.username}'. Skipping user.`);
      continue;
    }

    // Check if user already exists
    const existingUser = await prisma.users.findFirst({ where: { username: user.username } });
    if (existingUser) {
      console.log(`User '${user.username}' already exists. Skipping.`);
      continue;
    }

    try {
      // Only include non-null/undefined values
      const userData: any = {
        username: user.username,
        email: user.email,
        password: await hashPassword(user.password), // Hash the password
        phoneNo: user.phoneNo,
        roleId: roleMap[user.role],
      };

      // Only add optional fields if they have values
      if (user.stateId) userData.stateId = user.stateId;
      if (user.districtId) userData.districtId = user.districtId;
      if (user.policeStationId) userData.policeStationId = user.policeStationId;
      if (user.zoneId) userData.zoneId = user.zoneId;
      if (user.divisionId) userData.divisionId = user.divisionId;

      await prisma.users.create({
        data: userData,
      });
      console.log(`Created user: ${user.username}`);
    } catch (error) {
      console.error(`Error creating user ${user.username}:`, error);
    }
  }

  // --- WeaponTypeMaster Seeding ---
  console.log('Seeding weapon types...');

  const weaponTypes = [
    {
      name: "Pistol",
      description: "A compact handgun designed for one-handed use; commonly used for self-defense and law enforcement.",
      imageUrl: "https://example.com/images/pistol.png"
    },
    {
      name: "Revolver",
      description: "A handgun with a rotating cylinder containing multiple chambers; known for simple operation and reliability.",
      imageUrl: "https://example.com/images/revolver.png"
    },
    {
      name: "Semi-Automatic Pistol",
      description: "A pistol that fires one round per trigger pull and automatically cycles the next round into the chamber.",
      imageUrl: "https://example.com/images/semi_automatic_pistol.png"
    },
    {
      name: "Assault Rifle",
      description: "A lightweight, selective-fire rifle that uses intermediate cartridges; often used by military forces.",
      imageUrl: "https://example.com/images/assault_rifle.png"
    },
    {
      name: "Battle Rifle",
      description: "A full-power rifle typically chambered in larger calibers, designed for longer-range combat roles.",
      imageUrl: "https://example.com/images/battle_rifle.png"
    },
    {
      name: "Carbine",
      description: "A shorter, lighter version of a rifle that trades some range for improved maneuverability.",
      imageUrl: "https://example.com/images/carbine.png"
    },
    {
      name: "Shotgun",
      description: "A smoothbore long gun that fires shot or slugs; commonly used for hunting, sport, and close-range defense.",
      imageUrl: "https://example.com/images/shotgun.png"
    },
    {
      name: "Sniper Rifle",
      description: "A precision rifle configured for long-range accuracy; typically used with optics for marksmanship roles.",
      imageUrl: "https://example.com/images/sniper_rifle.png"
    },
    {
      name: "Submachine Gun (SMG)",
      description: "A compact, fully- or select-fire weapon that fires pistol-caliber rounds; suited for close-quarters engagements.",
      imageUrl: "https://example.com/images/smg.png"
    },
    {
      name: "Machine Gun",
      description: "A fully automatic firearm designed for sustained fire, typically crew-served or vehicle-mounted.",
      imageUrl: "https://example.com/images/machine_gun.png"
    },
    {
      name: "Bolt-Action Rifle",
      description: "A manual-action rifle where the shooter cycles the bolt between shots; valued for simplicity and accuracy.",
      imageUrl: "https://example.com/images/bolt_action_rifle.png"
    },
    {
      name: "Personal Defense Weapon (PDW)",
      description: "A compact, lightweight firearm intended to provide more capability than a pistol while remaining easy to carry.",
      imageUrl: "https://example.com/images/pdw.png"
    }
  ];

  for (const weaponType of weaponTypes) {
    // Check if weapon type already exists
    const existingWeaponType = await prisma.weaponTypeMaster.findFirst({
      where: { name: weaponType.name }
    });

    if (existingWeaponType) {
      console.log(`Weapon type '${weaponType.name}' already exists. Skipping.`);
      continue;
    }

    try {
      await prisma.weaponTypeMaster.create({
        data: {
          name: weaponType.name,
          description: weaponType.description,
          imageUrl: weaponType.imageUrl,
        },
      });
      console.log(`Created weapon type: ${weaponType.name}`);
    } catch (error) {
      console.error(`Error creating weapon type ${weaponType.name}:`, error);
    }
  }

  // --- Role-Action Mappings Seeding ---
  console.log('Seeding role-action mappings...');

  // Get all roles and actions from database
  const allRoles = await prisma.roles.findMany();
  const allActions = await prisma.actiones.findMany();

  // Create mapping of codes to IDs for easier reference
  const roleCodeToId: Record<string, number> = {};
  const actionCodeToId: Record<string, number> = {};

  allRoles.forEach(role => {
    roleCodeToId[role.code] = role.id;
  });

  allActions.forEach(action => {
    actionCodeToId[action.code] = action.id;
  });

  // Define role-action mappings based on role hierarchy and permissions
  const roleActionMappings = [
    // SHO - Station House Officer can forward, reject, recommend, close
    { roleCode: 'SHO', actionCodes: ['FORWARD', 'RE_ENQUIRY', 'GROUND_REPORT', 'RETURN'] },

    // ACP - Assistant Commissioner can do all SHO actions plus approve
    { roleCode: 'ACP', actionCodes: ['FORWARD', 'RETURN'] },

    // DCP - Deputy Commissioner has broader approval powers
    { roleCode: 'DCP', actionCodes: ['FORWARD', 'RETURN'] },

    // ZS - Zonal Superintendent can handle all workflow actions
    { roleCode: 'ZS', actionCodes: ['FORWARD', 'INITIATED', 'RETURN'] },

    // CADO - Chief Administrative Officer
    { roleCode: 'CADO', actionCodes: ['FORWARD', 'RETURN'] },

    // AS - Arms Superintendent
    { roleCode: 'AS', actionCodes: ['FORWARD', 'RETURN'] },

    // ADO - Administrative Officer
    { roleCode: 'ADO', actionCodes: ['FORWARD', 'RETURN'] },

    // JTCP - Joint Commissioner of Police
    { roleCode: 'JTCP', actionCodes: ['FORWARD', 'RE_ENQUIRY', 'RETURN'] },

    // CP - Commissioner of Police (highest authority) - NO RETURN action
    { roleCode: 'CP', actionCodes: ['FORWARD', 'REJECT', 'APPROVED', 'CANCEL', 'RECOMMEND', 'NOT_RECOMMEND'] },

    // ADMIN - System Administrator (can perform all actions for system management)
    { roleCode: 'ADMIN', actionCodes: ['FORWARD', 'REJECT', 'APPROVED', 'CANCEL', 'RE_ENQUIRY', 'GROUND_REPORT', 'DISPOSE', 'RED_FLAG', 'INITIATE', 'CLOSE', 'RECOMMEND', 'NOT_RECOMMEND', 'RETURN'] },
  ];

  // Insert role-action mappings
  for (const mapping of roleActionMappings) {
    const roleId = roleCodeToId[mapping.roleCode];

    if (!roleId) {
      console.warn(`Role '${mapping.roleCode}' not found. Skipping mappings.`);
      continue;
    }

    for (const actionCode of mapping.actionCodes) {
      const actionId = actionCodeToId[actionCode];

      if (!actionId) {
        console.warn(`Action '${actionCode}' not found. Skipping mapping for role '${mapping.roleCode}'.`);
        continue;
      }

      // Check if mapping already exists
      const existingMapping = await prisma.rolesActionsMapping.findUnique({
        where: {
          roleId_actionId: {
            roleId: roleId,
            actionId: actionId
          }
        }
      });

      if (existingMapping) {
        console.log(`Role-Action mapping already exists: ${mapping.roleCode} -> ${actionCode}. Skipping.`);
        continue;
      }

      try {
        await prisma.rolesActionsMapping.create({
          data: {
            roleId: roleId,
            actionId: actionId,
            isActive: true
          }
        });
        console.log(`Created role-action mapping: ${mapping.roleCode} -> ${actionCode}`);
      } catch (error) {
        console.error(`Error creating role-action mapping ${mapping.roleCode} -> ${actionCode}:`, error);
      }
    }
  }

  console.log('Role-action mappings seeding completed!');
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    // process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
