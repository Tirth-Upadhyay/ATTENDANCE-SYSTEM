
import { Role, User, Equipment } from './types';

const ADMINS: User[] = Array.from({ length: 5 }, (_, i) => ({
  id: `admin-${i + 1}`,
  name: `Admin Commander ${i + 1}`,
  email: `admin${i + 1}@bcs.com`,
  password: `admin`,
  department: 'Operations HQ',
  role: Role.ADMIN,
  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=admin${i + 1}`,
  status: 'Online',
  locationHistory: [],
  attendance: []
}));

const rawData = [
  // Photographers
  { n: "Khushdil Goyal", d: "Photographers" }, { n: "Sahil Khedaskar", d: "Photographers" },
  { n: "Devanshi Thakkar", d: "Photographers" }, { n: "Rishita Parmar", d: "Photographers" },
  { n: "Manushree Patil", d: "Photographers" }, { n: "Nidhi Abhijit Mahajan", d: "Photographers" },
  { n: "Shriya Borkar", d: "Photographers" }, { n: "Shreya Deodhar", d: "Photographers" },
  { n: "Ashwini Mohite", d: "Photographers" }, { n: "Dhriti Jain", d: "Photographers" },
  { n: "Salil Deosthale", d: "Photographers" }, { n: "Prajwal Dattatray Gaikwad", d: "Photographers" },
  { n: "Raghav SONI (SB)", d: "Photographers" }, { n: "Dhanvi Dave (SB)", d: "Photographers" },
  { n: "Insiya Engineer (SB)", d: "Photographers" }, { n: "Shreyasi Apte", d: "Photographers" },
  { n: "Tejas naik", d: "Photographers" }, { n: "Krishna Rajeev(SB)", d: "Photographers" },
  { n: "Aarushi Rajesh (SB)", d: "Photographers" }, { n: "Shaunak Lotlikar (SB)", d: "Photographers" },
  { n: "Adarsh Gopakumar (SB)", d: "Photographers" }, { n: "Anshika Ahuja (SB)", d: "Photographers" },
  { n: "Asmi Kadam (SB)", d: "Photographers" }, { n: "Raunak Malhotra (SB)", d: "Photographers" },
  { n: "Shreya Arunagiri (SB)", d: "Photographers" }, { n: "Meghana Varma (SB)", d: "Photographers" },
  { n: "Bhavansh Shrimali (SB)", d: "Photographers" }, { n: "Saanvi Pathak (SB)", d: "Photographers" },
  { n: "Daksh Kaushik (SB)", d: "Photographers" }, { n: "Ajay Kaushal (SB)", d: "Photographers" },
  { n: "Krishna Warke (SB)", d: "Photographers" }, { n: "Neelam Suthar (SB)", d: "Photographers" },
  { n: "Dhvani Varadaraj Iyer (SB)", d: "Photographers" }, { n: "Animesh Varma (SB)", d: "Photographers" },
  { n: "Aaryan Bayaskar (SB)", d: "Photographers" }, { n: "Snigdha Sameer Potadar (SB)", d: "Photographers" },
  { n: "HARSHVARDHAN KARVINKOP(SB)", d: "Photographers" },

  // Videographers
  { n: "Rajbeer Singh Jagdev", d: "Videographers" }, { n: "Tushar", d: "Videographers" },
  { n: "Bhavesh kulkarni", d: "Videographers" }, { n: "Augnik Gupta (SB)", d: "Videographers" },
  { n: "Vedang Joshi (SB)", d: "Videographers" }, { n: "Romano Antonio Vieira (SB)", d: "Videographers" },
  { n: "Atharva ause", d: "Videographers" }, { n: "Shubham Gautam (SB)", d: "Videographers" },
  { n: "Aryan mahadik (sb)", d: "Videographers" }, { n: "Nidhal Mohamed Nahas", d: "Videographers" },
  { n: "Vinikesh Hiranandani", d: "Videographers" }, { n: "Pranav Jadhao (SB)", d: "Videographers" },
  { n: "Bhavya Goswami", d: "Videographers" }, { n: "Kanchan Singh", d: "Videographers" },
  { n: "Pritika Budhia", d: "Videographers" }, { n: "Ronik Dey", d: "Videographers" },
  { n: "Reva Gugale", d: "Videographers" }, { n: "Yash Pratap Srivastava (SB)", d: "Videographers" },
  { n: "Nishant Bholane (SB)", d: "Videographers" }, { n: "Shivdas Karangale(SB)", d: "Videographers" },
  { n: "JAYESH PATIL", d: "Videographers" }, { n: "Devank Kaushik", d: "Videographers" },
  { n: "Sampada (SB)", d: "Videographers" }, { n: "Avesh Niture (SB)", d: "Videographers" },
  { n: "Albin Daniel", d: "Videographers" }, { n: "Aditi Singh", d: "Videographers" },
  { n: "Chandrima samanta", d: "Videographers" }, { n: "Uday Joshi", d: "Videographers" },
  { n: "Bharti kumari mahto", d: "Videographers" }, { n: "Yuvika Mehta", d: "Videographers" },
  { n: "Sahil Patwardhan", d: "Videographers" }, { n: "Namrata Sachin Mankar", d: "Videographers" },
  { n: "Shreyash Punalkar (SB)", d: "Videographers" }, { n: "Sai Fokane (SB)", d: "Videographers" },
  { n: "Aanya Agarwal (SB)", d: "Videographers" }, { n: "Niveditha Jayadev (SB)", d: "Videographers" },
  { n: "Vedang Sawardekar (SB)", d: "Videographers" }, { n: "Austy Francis (SB)", d: "Videographers" },
  { n: "Pranjali Purandare (SB)", d: "Videographers" }, { n: "Khwaish Jain (SB)", d: "Videographers" },
  { n: "Vaishnav Shitut (SB)", d: "Videographers" }, { n: "Deepansh Rai (SB)", d: "Videographers" },
  { n: "Vishal Menon (SB)", d: "Videographers" }, { n: "Ishani Pawar", d: "Videographers" },
  { n: "Atharva gawai", d: "Videographers" }, { n: "Gouri VN", d: "Videographers" },
  { n: "Chaitri Lodha", d: "Videographers" }, { n: "Ayyan Shaikh", d: "Videographers" },
  { n: "Vinay Jain", d: "Videographers" }, { n: "Parth Jhalani", d: "Videographers" },
  { n: "Yadnesh Padalkar", d: "Videographers" }, { n: "Snigdha Potadar (SB)", d: "Videographers" },
  { n: "Vedika Rajan (SB)", d: "Videographers" }, { n: "Suhana Shrestha", d: "Videographers" },
  { n: "Nishant Sahu (SB)", d: "Videographers" }, { n: "Avdhoot Abhyankar (SB)", d: "Videographers" },
  { n: "Anshula Gavande (SB)", d: "Videographers" },

  // Anchors
  { n: "Riya Rai", d: "Anchors" }, { n: "SONALI KUMARI", d: "Anchors" },
  { n: "Siddhi Raj", d: "Anchors" }, { n: "Kardile Piyush Dattatraya", d: "Anchors" },
  { n: "Paridhi Raj", d: "Anchors" }, { n: "Manshvi kumari", d: "Anchors" },
  { n: "Alisha Kalda", d: "Anchors" },

  // Operations
  { n: "Samriddh Singh", d: "Operations" }, { n: "Kushal Mehrotra", d: "Operations" },
  { n: "Yusra Zafar", d: "Operations" }, { n: "Shruti Date", d: "Operations" },
  { n: "Shristi Gattani", d: "Operations" }, { n: "Manasi Patil", d: "Operations" },
  { n: "tanisha mahuley", d: "Operations" }, { n: "Aaditi Jana", d: "Operations" },
  { n: "Kanisha Jain", d: "Operations" }, { n: "Jay Dusane", d: "Operations" },
  { n: "Tirth Upadhyay", d: "Operations" }, { n: "SAYEE PURANDARE", d: "Operations" },
  { n: "Kashish Rathod", d: "Operations" }, { n: "Jeet Vhora", d: "Operations" },
  { n: "Kirti Vinod Jadhav", d: "Operations" }, { n: "Srushti Patil", d: "Operations" },
  { n: "Shanu Agrawal", d: "Operations" }, { n: "Agya sinha", d: "Operations" },
  { n: "Priyadarshni", d: "Operations" }, { n: "Chirag bhagchandani", d: "Operations" },
  { n: "Anushka Mudaliar", d: "Operations" }, { n: "Samruddhi Shewate", d: "Operations" },
  { n: "Rajvir Singh", d: "Operations" }, { n: "Anjali Chopda", d: "Operations" },
  { n: "Jasmeen Kaur Batth", d: "Operations" }, { n: "Kritika Parmar", d: "Operations" },
  { n: "Aarav Singh", d: "Operations" }, { n: "Shivi agarwal", d: "Operations" },
  { n: "Darshana Kailas Badgujar", d: "Operations" }, { n: "Anshika Kadam", d: "Operations" },
  { n: "Bavneet Singh", d: "Operations" }, { n: "Vedant Shete", d: "Operations" },
  { n: "Taniya Kapoor", d: "Operations" }, { n: "Saanvi Narisetty", d: "Operations" },
  { n: "Devish Darne", d: "Operations" }, { n: "Sanika Khedkar", d: "Operations" },
  { n: "Zuhair Khan", d: "Operations" }, { n: "jayesh b patil", d: "Operations" }
];

export const INITIAL_MEMBERS: User[] = rawData.map((item, idx) => ({
  id: `m-${idx + 1}`,
  name: item.n,
  // Format: [full_name]@bcs.com (removing spaces and special characters for email)
  email: `${item.n.replace(/[^\w]/g, '').toLowerCase()}@bcs.com`,
  password: `member`,
  department: item.d,
  role: Role.MEMBER,
  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.n}`,
  status: 'Offline',
  locationHistory: [],
  attendance: []
}));

export const INITIAL_USERS: User[] = [...ADMINS, ...INITIAL_MEMBERS];

export const INITIAL_EQUIPMENT: Equipment[] = [
  {
    id: 'eq-init-1',
    name: 'Sony Alpha A7R IV',
    serialNumber: 'BCS-CAM-001',
    assignedToId: 'm-1',
    status: 'Good',
    lastUpdated: new Date().toISOString()
  }
];
