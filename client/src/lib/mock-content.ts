export type AboutFeature = {
  title: string;
  description: string;
  image: string;
  mode: "image" | "text";
};

export type BlogPost = {
  slug: string;
  title: string;
  image: string;
  description: string;
  content: string[];
};

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type MockCartItem = {
  id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
};

export type MockOrder = {
  id: string;
  createdAt: string;
  status: "Pending" | "Processing" | "Delivered";
  total: number;
  items: Array<{ name: string; quantity: number }>;
};

export type MockPlant = {
  id: string;
  name: string;
  image: string;
  price: number;
  category: string;
  tags: string[];
  availability: "In Stock" | "Out Of Stock" | "Discontinued";
  shortDescription: string;
  description: string;
};

export const aboutFeatures: AboutFeature[] = [
  {
    mode: "image",
    image: "/frontend/AboutUS/image1.jpg",
    title: "",
    description: "",
  },
  {
    mode: "text",
    image: "/frontend/AboutUS/image2.png",
    title: "Organic and seed grown plants",
    description:
      "We offer organic and seed-grown plants, ensuring eco-friendly, chemical-free options for sustainable gardening.",
  },
  {
    mode: "image",
    image: "/frontend/AboutUS/image3.jpg",
    title: "",
    description: "",
  },
  {
    mode: "text",
    image: "/frontend/AboutUS/image4.png",
    title: "Friendly and fast support",
    description:
      "Our team responds quickly with practical guidance so you can keep your plants healthy and thriving.",
  },
  {
    mode: "image",
    image: "/frontend/AboutUS/image5.jpg",
    title: "",
    description: "",
  },
  {
    mode: "text",
    image: "/frontend/AboutUS/image6.png",
    title: "Expert guidance and resources",
    description:
      "We provide care guides, product picks, and practical tips from beginners to experienced plant lovers.",
  },
];

export const blogPosts: BlogPost[] = [
  {
    slug: "plants-in-every-home",
    title: "Why Plants Belong in Every Home",
    image: "/frontend/BlogPage/Box1.jpg",
    description:
      "Discover how indoor plants purify air, boost mood, and bring calm to your everyday spaces.",
    content: [
      "Plants are not only decorative. They help create healthier indoor environments and more relaxing routines.",
      "Start with easy plants like snake plant, pothos, and peace lily. Place them near natural light and water only when the top soil is dry.",
      "A small corner with greenery can improve focus and reduce stress while making your home feel more alive.",
    ],
  },
  {
    slug: "low-light-urban-plants",
    title: "Low-Light Plants for Urban Living",
    image: "/frontend/BlogPage/Box2.jpg",
    description:
      "The best plant options for apartments and north-facing rooms with limited sunlight.",
    content: [
      "Urban homes can still have a healthy indoor garden with the right low-light plants.",
      "Try ZZ plant, pothos, cast iron plant, and snake plant. Rotate plants weekly for even growth.",
      "Use bright wall colors and keep leaves clean so plants can absorb available light better.",
    ],
  },
  {
    slug: "choose-the-right-pot",
    title: "How to Choose the Right Pot for Your Plant",
    image: "/frontend/BlogPage/Box3.jpg",
    description:
      "Choosing the right pot affects root health, watering rhythm, and long-term growth.",
    content: [
      "Always pick pots with drainage holes to avoid root rot.",
      "When repotting, use a pot only 1-2 inches wider than the current root ball.",
      "Terracotta is great for fast drying. Ceramic and plastic retain moisture longer.",
    ],
  },
  {
    slug: "kitchen-herb-garden",
    title: "Best Herbs to Grow in Your Kitchen",
    image: "/frontend/BlogPage/Box6.jpg",
    description:
      "Build a simple indoor herb corner with basil, mint, rosemary, and parsley.",
    content: [
      "Kitchen herbs are practical, aromatic, and beginner-friendly.",
      "Use a sunny windowsill and well-draining soil. Harvest often to encourage fresh growth.",
      "Small daily care beats occasional overwatering. Keep the routine simple and consistent.",
    ],
  },
];

export const faqs: FaqItem[] = [
  {
    id: "faq-1",
    question: "How often should I water indoor plants?",
    answer:
      "Most indoor plants should be watered when the top 2-3 cm of soil is dry. Always check soil moisture first.",
  },
  {
    id: "faq-2",
    question: "Which plants are good for beginners?",
    answer:
      "Snake plant, pothos, ZZ plant, and peace lily are great beginner options because they are resilient and low-maintenance.",
  },
  {
    id: "faq-3",
    question: "How do I know if my plant needs repotting?",
    answer:
      "If roots circle tightly or come out of drainage holes, it is time to repot into a slightly larger pot.",
  },
  {
    id: "faq-4",
    question: "Do you provide support after purchase?",
    answer:
      "Yes. We provide care guidance and quick support to help you keep your plants healthy.",
  },
  {
    id: "faq-5",
    question: "Can I place all plants in direct sunlight?",
    answer:
      "No. Different plants have different light needs. Always check plant-specific light guidance before placement.",
  },
];

export const contactInfo = {
  heading: "Get In Touch",
  subheading: "We are just a message away from helping you.",
  phone: "+911776438935",
  email: "info@plantworld.com",
  address: "123 Bang Street, Ahmedabad",
  image: "/frontend/Contact Us/contact2.jpg",
};

export const mockUser = {
  id: "u-plant-001",
  name: "Plant Lover",
  email: "plant.lover@example.com",
  phone: "+91 98765 12345",
  joinedAt: "2025-11-17",
  avatar: "/frontend/Profile.jpg",
};

export const mockSettings = {
  newsletter: true,
  smsAlert: false,
  darkMode: false,
};

export const mockCartItems: MockCartItem[] = [
  {
    id: "cart-1",
    name: "Snake Plant",
    image: "/frontend/Featured Products/image4.jpg",
    price: 250,
    quantity: 2,
  },
  {
    id: "cart-2",
    name: "Aloe Vera",
    image: "/frontend/Featured Products/image1.jpg",
    price: 200,
    quantity: 1,
  },
  {
    id: "cart-3",
    name: "Money Plant",
    image: "/frontend/Featured Products/image7.jpg",
    price: 400,
    quantity: 1,
  },
];

export const mockAddress = {
  fullName: "Plant Lover",
  phone: "+91 98765 12345",
  addressLine: "123 Bang Street",
  city: "Ahmedabad",
  postalCode: "380001",
  note: "Please call before delivery.",
};

export const mockOrders: MockOrder[] = [
  {
    id: "ORD-PW-1001",
    createdAt: "2026-03-30",
    status: "Delivered",
    total: 850,
    items: [
      { name: "Snake Plant", quantity: 1 },
      { name: "Aloe Vera", quantity: 2 },
    ],
  },
  {
    id: "ORD-PW-1002",
    createdAt: "2026-04-06",
    status: "Processing",
    total: 600,
    items: [{ name: "Peace Lily", quantity: 1 }],
  },
  {
    id: "ORD-PW-1003",
    createdAt: "2026-04-07",
    status: "Pending",
    total: 420,
    items: [
      { name: "Cactus", quantity: 1 },
      { name: "Herb Pot", quantity: 1 },
    ],
  },
];

export const mockPlants: MockPlant[] = [
  {
    id: "plant-001",
    name: "Aloe Vera",
    image: "/frontend/Featured Products/image1.jpg",
    price: 200,
    category: "Succulent Plants",
    tags: ["indoor", "easy-care", "desktop"],
    availability: "In Stock",
    shortDescription: "Low-maintenance plant known for medicinal value.",
    description:
      "Aloe Vera thrives in bright indirect light and needs minimal watering. It is ideal for home and office desks.",
  },
  {
    id: "plant-002",
    name: "Snake Plant",
    image: "/frontend/Featured Products/image4.jpg",
    price: 250,
    category: "Foliage Plants",
    tags: ["indoor", "easy-care", "office"],
    availability: "In Stock",
    shortDescription: "Air-purifying and very beginner-friendly plant.",
    description:
      "Snake Plant is resilient and handles low light very well. Water sparingly and let soil dry between watering.",
  },
  {
    id: "plant-003",
    name: "Money Plant",
    image: "/frontend/Featured Products/image7.jpg",
    price: 400,
    category: "Climbing Plants",
    tags: ["indoor", "living-room", "balcony"],
    availability: "In Stock",
    shortDescription: "Popular decorative vine for homes and balconies.",
    description:
      "Money Plant grows quickly in containers and can be trained on support or kept as a trailing plant.",
  },
  {
    id: "plant-004",
    name: "Peace Lily",
    image: "/frontend/Featured Products/image8.jpg",
    price: 600,
    category: "Flowering Plants",
    tags: ["indoor", "shade-loving", "bedroom"],
    availability: "Out Of Stock",
    shortDescription: "Elegant flowering indoor plant with glossy leaves.",
    description:
      "Peace Lily prefers filtered light and slightly moist soil. Avoid direct harsh sun exposure.",
  },
];

export const mockAdminSummary = {
  totalPlants: 124,
  totalUsers: 380,
  totalOrders: 192,
  pendingOrders: 23,
};

export const mockAdminUsers = [
  {
    id: "u-001",
    name: "Aarav Patel",
    email: "aarav@example.com",
    role: "user",
  },
  { id: "u-002", name: "Mira Shah", email: "mira@example.com", role: "user" },
  {
    id: "u-003",
    name: "Nikhil Rao",
    email: "nikhil@example.com",
    role: "deliverypartner",
  },
];

export const mockAdminFaqs = [
  {
    id: "f-1",
    question: "How long is delivery?",
    answer: "Usually 2-4 business days.",
  },
  {
    id: "f-2",
    question: "Can I return damaged plants?",
    answer: "Yes, with photo proof within 24 hours.",
  },
];

export const mockDeliveryPartners = [
  {
    id: "dp-01",
    name: "Rohan Singh",
    phone: "+91 90000 00001",
    status: "active",
  },
  {
    id: "dp-02",
    name: "Anaya Gupta",
    phone: "+91 90000 00002",
    status: "active",
  },
];

export const mockDeliveryOrders = [
  {
    id: "DPO-1001",
    customer: "Aarav Patel",
    address: "Ahmedabad",
    status: "Out for delivery",
  },
  { id: "DPO-1002", customer: "Mira Shah", address: "Surat", status: "Picked" },
];

export const mockDeliveryProfile = {
  name: "Rohan Singh",
  email: "rohan.dp@example.com",
  phone: "+91 90000 00001",
  zone: "Ahmedabad West",
};
