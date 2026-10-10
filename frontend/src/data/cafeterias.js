import vista from "../assets/cafeterias/vista.jpg";
import amitie from "../assets/cafeterias/amitie.jpg";
import monpura from "../assets/cafeterias/monpura.jpg";
import pitstop from "../assets/cafeterias/pitstop.jpg";

export const CAFETERIAS = [
  {
    id: "vista",
    name: "Vista Cafe",
    tagline: "Academic ground floor dining & continental delights",
    building: "Academic Building",
    floor: "Ground Floor",
    image: vista,
    isOpen: true,
    openingHours: "8:00 AM – 6:30 PM",
    queueMinutes: 6,
    crowdLevel: "Moderate",
    rating: 4.8,
    reviewsCount: 342,
    cuisine: "Continental & Bengali Meals",
    popularItems: [
      { name: "Crispy Chicken Burger", price: 150, tag: "Hot Seller", calories: "420 kcal" },
      { name: "Egg Fried Rice with Chicken Chilli", price: 180, tag: "Chef's Special", calories: "550 kcal" },
      { name: "Hot Chocolate & Cold Coffee", price: 80, tag: "Beverage", calories: "180 kcal" },
      { name: "Grilled Club Sandwich", price: 120, tag: "Quick Snack", calories: "320 kcal" },
    ],
  },
  {
    id: "amitie",
    name: "Amitie Cafeteria",
    tagline: "Traditional Bengali meals, snacks & 'Daabing' juice corner",
    building: "FBS Building",
    floor: "Ground Floor",
    image: amitie,
    isOpen: true,
    openingHours: "8:00 AM – 7:30 PM",
    queueMinutes: 8,
    crowdLevel: "Busy",
    rating: 4.9,
    reviewsCount: 512,
    cuisine: "Bengali Meals, Tehari & 'Daabing' Juices",
    popularItems: [
      { name: "Morog Polao (Chicken Pilaf)", price: 130, tag: "Chef's Special", calories: "680 kcal" },
      { name: "Chicken Tehari", price: 70, tag: "Campus Favorite", calories: "520 kcal" },
      { name: "Daab Smoothie", price: 60, tag: "Daabing Special", calories: "180 kcal" },
      { name: "Daab Pudding", price: 60, tag: "Daabing Corner", calories: "140 kcal" },
    ],
  },
  {
    id: "pitstop",
    name: "Pitstop",
    tagline: "Crispy chicken, personal pizza, Chinese bowls & fries",
    building: "FASS Building",
    floor: "Ground Floor Walkway",
    image: pitstop,
    isOpen: true,
    openingHours: "8:00 AM – 5:30 PM",
    queueMinutes: 3,
    crowdLevel: "Fast",
    rating: 4.8,
    reviewsCount: 246,
    cuisine: "Fast Food, Pizza & Chinese",
    popularItems: [
      { name: "Naga Fried Chicken", price: 100, tag: "Campus Favorite", calories: "360 kcal" },
      { name: "Chicken Pizza", price: 110, tag: "Hot Seller", calories: "480 kcal" },
      { name: "Beef Chilli", price: 130, tag: "Chef's Special", calories: "420 kcal" },
      { name: "French Fries", price: 60, tag: "Quick Snack", calories: "280 kcal" },
    ],
  },
  {
    id: "monpura",
    name: "Third Place",
    tagline: "Lakeside dining, traditional Bengali breakfast/lunch & evening snacks",
    building: "Monpura Lakeside",
    floor: "Lakeside Deck",
    image: monpura,
    isOpen: true,
    openingHours: "8:00 AM – 9:30 PM",
    queueMinutes: 6,
    crowdLevel: "Moderate",
    rating: 4.9,
    reviewsCount: 418,
    cuisine: "Bengali Meals, Fast Food, Snacks & Ice Cream",
    popularItems: [
      { name: "Morog Polao", price: 150, tag: "Signature Lunch", calories: "620 kcal" },
      { name: "Beef Tehari", price: 140, tag: "Campus Special", calories: "610 kcal" },
      { name: "Carnival Hazelnut Cone", price: 70, tag: "Ice Cream", calories: "240 kcal" },
      { name: "Chotpoti", price: 30, tag: "Tea Break", calories: "240 kcal" },
    ],
  },
];

export const INFO_CARDS = [
  { id: "special", label: "Today's Special", value: "Morog Polao", sub: "Amitie Cafeteria · Fresh Batch", icon: "utensils" },
  { id: "queue", label: "Shortest Queue", value: "3 mins", sub: "Pitstop · Ready to grab", icon: "clock" },
  { id: "open", label: "Open Cafeterias", value: "3 of 4", sub: "Monpura opens at 5:00 PM", icon: "coffee" },
  { id: "popular", label: "Orders Today", value: "384+", sub: "89% picked up in under 5 mins", icon: "shoppingBag" },
  { id: "activity", label: "Campus Lunch Rush", value: "Moderate", sub: "Next rush peak at 1:15 PM", icon: "zap" },
];

export const FEATURES = [
  {
    id: "skip-queue",
    icon: "zap",
    title: "Zero Queue Ordering",
    desc: "Order directly from your class or dorm. Walk straight to the dedicated express counter when your meal is hot and ready.",
  },
  {
    id: "live-menu",
    icon: "utensils",
    title: "Live Kitchen Sync",
    desc: "No more arriving at the counter to find items sold out. Real-time availability reflects exact kitchen stock.",
  },
  {
    id: "smart-queues",
    icon: "clock",
    title: "Real-time Wait Estimates",
    desc: "Smart prediction models compute current prep and line times so you always know the fastest spot on campus.",
  },
  {
    id: "multi-role",
    icon: "shield",
    title: "Verified Campus Access",
    desc: "Seamless single-sign-on for Students, Faculty, and Staff, plus temporary 7-day visitor passes for campus guests.",
  },
];

export const TESTIMONIALS = [
  {
    id: 1,
    quote: "Between back-to-back engineering labs, I used to waste 20 minutes standing in line. Now I order from the lab and pick up my Tehari instantly.",
    author: "Zubair Al-Mamun",
    role: "B.Sc. in CSE, 4th Year",
    avatar: "Z",
  },
  {
    id: 2,
    quote: "As faculty with tight lecture schedules, having guaranteed meal pickup at Vista without the lunchtime chaos is an absolute lifesaver.",
    author: "Dr. Nazia Farhana",
    role: "Associate Professor, FASS",
    avatar: "N",
  },
  {
    id: 3,
    quote: "The guest pass allowed me to seamlessly order lunch during the National University Debate Championship without needing student credentials.",
    author: "Rohan Sen",
    role: "Campus Guest & Debater",
    avatar: "R",
  },
];

export const FAQS = [
  {
    q: "How does the University ID login work?",
    a: "Students and Faculty can log in using their official University ID and password. If you haven't set a password or forgot it, you can request an instant 6-digit OTP to your university email address.",
  },
  {
    q: "How do campus visitors or guests use the system?",
    a: "Visitors can click 'Continue as Guest' to register with their name, phone, and personal email. Once verified with an OTP, a temporary 7-day guest pass is activated.",
  },
  {
    q: "How are queue times calculated?",
    a: "Queue estimates combine active kitchen orders in preparation and counter transaction throughput to display real-time wait minutes.",
  },
  {
    q: "What payment methods will be supported?",
    a: "Module 1 covers authentication and discovery. Upcoming modules will support bKash, Nagad, University Student ID Smart Card balance, and debit cards.",
  },
];

export const SAMPLE_ORDERS = [
  {
    id: "ORD-9281",
    cafeteria: "Vista Cafe",
    items: [
      { name: "Egg Fried Rice with Chicken Chilli", qty: 1, price: 180 },
      { name: "Iced Cold Coffee", qty: 1, price: 80 },
    ],
    total: 260,
    status: "Ready for Pickup",
    statusCode: "ready",
    time: "12:45 PM Today",
    pickupCounter: "Counter 2 (Express)",
  },
  {
    id: "ORD-9104",
    cafeteria: "Amitie Cafeteria",
    items: [
      { name: "Chicken Tehari", qty: 1, price: 70 },
      { name: "Borhani", qty: 1, price: 40 },
    ],
    total: 110,
    status: "Completed",
    statusCode: "completed",
    time: "Yesterday, 1:15 PM",
    pickupCounter: "Counter 1",
  },
  {
    id: "ORD-8832",
    cafeteria: "Pitstop",
    items: [
      { name: "Chicken Sub Sandwich", qty: 1, price: 130 },
      { name: "Orange Juice", qty: 1, price: 70 },
    ],
    total: 200,
    status: "Completed",
    statusCode: "completed",
    time: "24 Sept, 10:30 AM",
    pickupCounter: "Express Window",
  },
];

export const SAMPLE_FAVORITES = [
  {
    id: "fav-1",
    name: "Chicken Tehari",
    cafeteria: "Amitie Cafeteria",
    price: 70,
    category: "Lunch Special",
  },
  {
    id: "fav-2",
    name: "Crispy Chicken Burger",
    cafeteria: "Vista Cafe",
    price: 150,
    category: "Fast Food",
  },
  {
    id: "fav-3",
    name: "Iced Caramel Macchiato",
    cafeteria: "Pitstop",
    price: 90,
    category: "Coffee & Drinks",
  },
];
