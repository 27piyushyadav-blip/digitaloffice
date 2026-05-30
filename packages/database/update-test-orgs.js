const postgres = require('postgres');

const sql = postgres('postgresql://postgres.dpnappudvlepyrwueaqy:TestSupper9981@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres');

const dataToUpdate = {
  "Satyam Kumar": {
    tagline: "Premium Wellness & Healing",
    description: "Therapeutic massage and holistic healing services tailored to your body's needs.",
    cover_image_url: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=2070&auto=format&fit=crop",
    products: [
      { name: "Lavender Massage Oil", price: "$25", image: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?q=80&w=900&auto=format&fit=crop" },
      { name: "Herbal Body Balm", price: "$32", image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=900&auto=format&fit=crop" }
    ],
    features: [
      { title: "Hygienic Environment", description: "Clean and safe for your comfort" },
      { title: "Certified Therapist", description: "Professional care and certification" }
    ]
  },
  "lori massage parlour": {
    tagline: "Traditional Asian Healing & Spa",
    description: "Specialized deep tissue and traditional oil therapies for body recovery and relaxation.",
    cover_image_url: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?q=80&w=2070&auto=format&fit=crop",
    products: [
      { name: "Natural Massage Balm", price: "$20", image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=900&auto=format&fit=crop" },
      { name: "Aromatherapy Diffuser", price: "$45", image: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?q=80&w=900&auto=format&fit=crop" }
    ],
    features: [
      { title: "Traditional Techniques", description: "Authentic therapy methods" },
      { title: "Peaceful Atmosphere", description: "Designed for deep relaxation" }
    ]
  },
  "PIYUSH YADAV": {
    tagline: "Expert Clinical Massage Therapy",
    description: "Recover from injuries, muscle tension, and chronic pain with targeted clinical therapies.",
    cover_image_url: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?q=80&w=2070&auto=format&fit=crop",
    products: [
      { name: "Relieving Muscle Gel", price: "$28", image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=900&auto=format&fit=crop" },
      { name: "Orthopedic Pillow", price: "$65", image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?q=80&w=900&auto=format&fit=crop" }
    ],
    features: [
      { title: "Clinical Expertise", description: "Certified medical massage therapist" },
      { title: "Individualized Treatment", description: "Custom plans for every client" }
    ]
  },
  "Swayam Kadam": {
    tagline: "Holistic Body Mind Alignment",
    description: "A calming sanctuary offering restorative massage and mindfulness alignment sessions.",
    cover_image_url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=2070&auto=format&fit=crop",
    products: [
      { name: "Lavender Essential Oil", price: "$22", image: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?q=80&w=900&auto=format&fit=crop" },
      { name: "Soy Wax Scented Candle", price: "$18", image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?q=80&w=900&auto=format&fit=crop" }
    ],
    features: [
      { title: "Mind-Body Focus", description: "Promoting physical and mental relief" },
      { title: "Premium Organic Oils", description: "All-natural ingredients" }
    ]
  }
};

async function updateTestOrgs() {
  try {
    console.log('Updating test organizations...');
    for (const [name, fields] of Object.entries(dataToUpdate)) {
      console.log(`Updating ${name}...`);
      
      const productsJson = JSON.stringify(fields.products);
      const featuresJson = JSON.stringify(fields.features);
      
      const res = await sql`
        UPDATE organization_profile
        SET 
          tagline = ${fields.tagline},
          description = ${fields.description},
          cover_image_url = ${fields.cover_image_url},
          products = ${productsJson},
          features = ${featuresJson}
        WHERE name = ${name}
        RETURNING id
      `;
      
      if (res.length > 0) {
        console.log(`Successfully updated ${name} (ID: ${res[0].id})`);
      } else {
        console.log(`Organization ${name} not found or not updated`);
      }
    }
  } catch (error) {
    console.error('Error updating database:', error);
  } finally {
    await sql.end();
  }
}

updateTestOrgs();
