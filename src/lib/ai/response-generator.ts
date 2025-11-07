import { Mobile } from "@/types/mobile";
import { generateResponse } from "./gemini";
import {
  SYSTEM_PROMPT,
  SEARCH_PROMPT_TEMPLATE,
  COMPARISON_PROMPT_TEMPLATE,
  EXPLANATION_PROMPT_TEMPLATE,
} from "./prompts";

/**
 * Generates a natural language search response with phone recommendations
 * @param query - The user's search query
 * @param phones - Array of matching phones (already limited to top results)
 * @param budget - Optional budget constraint
 * @returns Promise<string> - Formatted response text
 */
export async function generateSearchResponse(
  query: string,
  phones: Mobile[],
  budget?: number
): Promise<string> {
  if (phones.length === 0) {
    return `I couldn't find any phones matching your criteria${
      budget ? ` under ₹${budget.toLocaleString()}` : ""
    }. Would you like to adjust your requirements or try a different search?`;
  }

  // Use exactly the phones provided (already limited to top 3)
  const topPhones = phones;
  const phoneCount = topPhones.length;
  
  const phoneSummary = topPhones.map((phone, idx) => `
${idx + 1}. ${phone.model} (₹${phone.price.toLocaleString()})
   - Camera: ${phone.primary_camera_rear}MP
   - Battery: ${phone.battery_capacity}mAh
   - RAM: ${phone.ram_capacity}GB
   - Rating: ${phone.rating}/100
  `).join("\n");

  const criteria = {
    query,
    budget: budget ? `₹${budget.toLocaleString()}` : "any budget",
    phones: phoneSummary,
  };

  const prompt = SEARCH_PROMPT_TEMPLATE
    .replace("{criteria}", JSON.stringify(criteria, null, 2))
    .replace(/{count}/g, phoneCount.toString());

  try {
    const response = await generateResponse(prompt, SYSTEM_PROMPT);
    
    // If response is empty or too short, use fallback
    if (!response || response.trim().length < 50) {
      console.warn('[Search Response] AI response too short, using fallback');
      return generateSimpleSearchResponse(phones, budget);
    }
    
    return response;
  } catch (error) {
    console.error('[Search Response] AI generation failed:', error);
    return generateSimpleSearchResponse(phones, budget);
  }
}

function generateSimpleSearchResponse(phones: Mobile[], budget?: number): string {
  // Use exactly the phones provided
  const topPhones = phones;
  const count = topPhones.length;
  
  let response = `I found ${count} excellent option${count > 1 ? 's' : ''} for you${budget ? ` under ₹${budget.toLocaleString()}` : ""}:\n\n`;
  
  topPhones.forEach((phone, idx) => {
    response += `**${idx + 1}. ${phone.model}** - ₹${phone.price.toLocaleString()}\n`;
    
    // Add "Why recommended" explanation
    response += `**Why recommended?** `;
    const reasons = [];
    
    if (phone.primary_camera_rear >= 50) {
      reasons.push(`${phone.primary_camera_rear}MP camera for excellent photo quality`);
    } else if (phone.primary_camera_rear >= 40) {
      reasons.push(`${phone.primary_camera_rear}MP camera for good photos`);
    }
    
    if (phone.battery_capacity >= 5000) {
      reasons.push(`${phone.battery_capacity}mAh battery for all-day usage`);
    } else if (phone.battery_capacity >= 4500) {
      reasons.push(`${phone.battery_capacity}mAh battery for reliable battery life`);
    }
    
    if (phone.ram_capacity >= 8) {
      reasons.push(`${phone.ram_capacity}GB RAM for smooth multitasking`);
    } else if (phone.ram_capacity >= 6) {
      reasons.push(`${phone.ram_capacity}GB RAM for good performance`);
    }
    
    if (phone.refresh_rate >= 120) {
      reasons.push(`${phone.refresh_rate}Hz display for ultra-smooth scrolling`);
    } else if (phone.refresh_rate >= 90) {
      reasons.push(`${phone.refresh_rate}Hz display for smooth visuals`);
    }
    
    if (phone.has_5g) {
      reasons.push(`5G ready for future-proof connectivity`);
    }
    
    if (reasons.length > 0) {
      response += reasons.slice(0, 3).join(', ') + '. ';
    } else {
      response += `Solid specs with ${phone.primary_camera_rear}MP camera, ${phone.battery_capacity}mAh battery, and ${phone.ram_capacity}GB RAM. `;
    }
    
    response += `Great value at this price point.\n\n`;
    
    // Add key specs
    response += `**Key Specs:** ${phone.primary_camera_rear}MP Camera • ${phone.battery_capacity}mAh Battery • ${phone.ram_capacity}GB RAM • ${phone.internal_memory}GB Storage${phone.has_5g ? ' • 5G' : ''}\n\n`;
  });

  return response;
}

/**
 * Generates a natural language comparison response for multiple phones
 * @param phones - Array of phones to compare
 * @returns Promise<string> - Formatted comparison text
 */
export async function generateComparisonResponse(
  phones: Mobile[]
): Promise<string> {
  if (phones.length < 2) {
    return "Please provide at least 2 phones to compare.";
  }

  const phonesData = phones.map(phone => ({
    model: phone.model,
    price: `₹${phone.price.toLocaleString()}`,
    camera: `${phone.primary_camera_rear}MP`,
    battery: `${phone.battery_capacity}mAh`,
    ram: `${phone.ram_capacity}GB`,
    rating: `${phone.rating}/100`,
  }));

  const prompt = COMPARISON_PROMPT_TEMPLATE.replace(
    "{phones}",
    JSON.stringify(phonesData, null, 2)
  );

  try {
    const response = await generateResponse(prompt, SYSTEM_PROMPT);
    
    // If response is empty or too short, use fallback
    if (!response || response.trim().length < 100) {
      console.warn('[Comparison Response] AI response too short, using fallback');
      return generateSimpleComparisonResponse(phones);
    }
    
    return response;
  } catch (error) {
    console.error('[Comparison Response] AI generation failed:', error);
    return generateSimpleComparisonResponse(phones);
  }
}

function generateSimpleComparisonResponse(phones: Mobile[]): string {
  let response = `Let's compare ${phones.map(p => p.model).join(" vs ")}:\n\n`;
  
  response += "**Quick Comparison:**\n\n";
  response += "| Feature | " + phones.map((p, i) => `Phone ${i + 1}`).join(" | ") + " |\n";
  response += "|---------|" + phones.map(() => "---------").join("|") + "|\n";
  response += "| **Model** | " + phones.map(p => p.model).join(" | ") + " |\n";
  response += "| **Price** | " + phones.map(p => `₹${p.price.toLocaleString()}`).join(" | ") + " |\n";
  response += "| **Camera** | " + phones.map(p => `${p.primary_camera_rear}MP`).join(" | ") + " |\n";
  response += "| **Battery** | " + phones.map(p => `${p.battery_capacity}mAh`).join(" | ") + " |\n";
  response += "| **RAM** | " + phones.map(p => `${p.ram_capacity}GB`).join(" | ") + " |\n";
  response += "| **Display** | " + phones.map(p => `${p.refresh_rate}Hz`).join(" | ") + " |\n";
  response += "| **5G** | " + phones.map(p => p.has_5g ? '✓ Yes' : '✗ No').join(" | ") + " |\n\n";
  
  response += "**What Makes Each Special:**\n\n";
  
  phones.forEach((phone, idx) => {
    response += `**${idx + 1}. ${phone.model}** (₹${phone.price.toLocaleString()})\n`;
    response += `• `;
    const highlights = [];
    
    if (phone.primary_camera_rear >= 50) highlights.push(`${phone.primary_camera_rear}MP camera is excellent for photography`);
    if (phone.battery_capacity >= 5000) highlights.push(`${phone.battery_capacity}mAh battery provides all-day power`);
    if (phone.ram_capacity >= 8) highlights.push(`${phone.ram_capacity}GB RAM ensures smooth multitasking`);
    if (phone.refresh_rate >= 120) highlights.push(`${phone.refresh_rate}Hz display offers ultra-smooth visuals`);
    if (phone.has_5g) highlights.push(`5G support for faster connectivity`);
    
    if (highlights.length > 0) {
      response += highlights.slice(0, 2).join('\n• ') + '\n';
    } else {
      response += `Solid performance with ${phone.primary_camera_rear}MP camera and ${phone.battery_capacity}mAh battery\n`;
    }
    response += '\n';
  });
  
  // Add a simple recommendation
  const cheapest = phones.reduce((min, p) => p.price < min.price ? p : min);
  const bestCamera = phones.reduce((max, p) => p.primary_camera_rear > max.primary_camera_rear ? p : max);
  const bestBattery = phones.reduce((max, p) => p.battery_capacity > max.battery_capacity ? p : max);
  
  response += "**Quick Recommendations:**\n";
  response += `• **Best Value:** ${cheapest.model} (most affordable at ₹${cheapest.price.toLocaleString()})\n`;
  response += `• **Best Camera:** ${bestCamera.model} (${bestCamera.primary_camera_rear}MP)\n`;
  response += `• **Best Battery:** ${bestBattery.model} (${bestBattery.battery_capacity}mAh)\n`;
  
  return response;
}

/**
 * Generates an explanation response for technical terms
 * Uses built-in explanations first, falls back to AI for uncommon terms
 * @param query - The term or concept to explain
 * @returns Promise<string> - Formatted explanation text
 */
export async function generateExplanationResponse(query: string): Promise<string> {
  // Check fallback explanations FIRST for reliability
  const fallback = generateFallbackExplanation(query);
  
  // If we have a built-in explanation, use it
  if (!fallback.includes("I'm having trouble accessing my explanation database")) {
    return fallback;
  }
  
  // Only use Gemini for uncommon terms not in our built-in list
  const prompt = EXPLANATION_PROMPT_TEMPLATE.replace("{query}", query);

  try {
    const response = await generateResponse(prompt, SYSTEM_PROMPT);
    
    // Validate that Gemini provided a useful response
    if (response.includes("having trouble") || 
        response.includes("can't help") ||
        response.includes("don't know") ||
        response.length < 50) {
      return fallback;
    }
    
    return response;
  } catch (error) {
    return fallback;
  }
}

function generateFallbackExplanation(query: string): string {
  const lowerQuery = query.toLowerCase();
  
  // IR Blaster
  if (lowerQuery.includes("ir blaster") || lowerQuery.includes("infrared blaster")) {
    return `**IR Blaster (Infrared Blaster)**

An IR Blaster is a hardware component that allows your phone to function as a universal remote control for TVs, air conditioners, and other home appliances that use infrared signals.

**How it works:**
- Emits infrared light signals (invisible to human eyes)
- Mimics signals from traditional remote controls
- Works with any device that has an IR receiver

**What you can control:**
- TVs (all brands)
- Air conditioners
- Set-top boxes
- Home theater systems
- Projectors
- DVD/Blu-ray players

**Practical use:**
- Use your phone as a universal remote
- No need to carry multiple remotes
- Control devices even if original remote is lost
- Usually works through dedicated apps (like Mi Remote, Peel Smart Remote)

**Availability:**
IR Blasters were more common in older phones but have become less common in recent years. Xiaomi/Redmi phones often still include them, making them popular in markets like India where this feature is valued.`;
  }
  
  // OIS
  if (lowerQuery.includes("ois")) {
    return `**OIS (Optical Image Stabilization)**

OIS is a camera technology that uses tiny motors to physically move the camera lens or sensor to counteract hand shake and movement while taking photos or videos.

**How it works:**
- Gyroscopes detect hand movement
- Motors adjust the lens position in real-time
- Results in sharper photos and smoother videos

**Benefits:**
- Better low-light photography
- Sharper images when shooting handheld
- Smoother video recording
- Especially useful for zoom shots

**What to look for:**
Look for "OIS" in the camera specifications. It's typically found on higher-end phones and makes a significant difference in photo/video quality.`;
  }
  
  // EIS
  if (lowerQuery.includes("eis")) {
    return `**EIS (Electronic Image Stabilization)**

EIS is a software-based stabilization technique that crops and shifts the video frame digitally to compensate for camera shake.

**How it works:**
- Software analyzes the video frames
- Digitally crops and aligns frames
- Creates smoother footage through software processing

**Benefits:**
- Smoother video recording
- No additional hardware needed
- Works on budget phones

**OIS vs EIS:**
- OIS is hardware-based, EIS is software-based
- OIS works for both photos and videos, EIS mainly for videos
- OIS generally produces better results
- Many flagship phones have both!`;
  }
  
  // Refresh Rate
  if (lowerQuery.includes("refresh rate") || lowerQuery.includes("hz") || lowerQuery.includes("120hz") || lowerQuery.includes("90hz")) {
    return `**Refresh Rate**

The refresh rate (measured in Hz) indicates how many times per second your phone's screen updates the image.

**Common rates:**
- 60Hz - Standard (updates 60 times/second)
- 90Hz - Smooth (updates 90 times/second)  
- 120Hz - Very Smooth (updates 120 times/second)
- 144Hz - Ultra Smooth (gaming phones)

**Benefits of higher refresh rate:**
- Smoother scrolling through apps and websites
- More responsive touch input
- Better gaming experience
- More fluid animations

**Trade-off:**
Higher refresh rates consume more battery, but many phones have adaptive refresh rates that adjust based on what you're doing.`;
  }
  
  // Processor/CPU
  if (lowerQuery.includes("processor") || lowerQuery.includes("cpu") || lowerQuery.includes("chipset") || lowerQuery.includes("snapdragon") || lowerQuery.includes("mediatek")) {
    return `**Mobile Processor (CPU/Chipset)**

The processor is the "brain" of your phone - it handles all calculations and runs your apps.

**Key factors:**
- **Brand:** Snapdragon, MediaTek, Apple A-series, Exynos
- **Cores:** More cores = better multitasking (typically 4-8 cores)
- **Speed:** Measured in GHz (higher = faster)
- **Generation:** Newer processors are more efficient

**Impact on daily use:**
- App loading speed
- Gaming performance
- Multitasking capability
- Battery efficiency
- AI features
- Camera processing

**What to look for:**
For everyday use, mid-range processors (Snapdragon 7-series, MediaTek Dimensity) are sufficient. For gaming, look for flagship processors (Snapdragon 8-series).`;
  }

  // RAM
  if (lowerQuery.includes("ram") && !lowerQuery.includes("program")) {
    return `**RAM (Random Access Memory)**

RAM is your phone's short-term memory that holds apps and data while you're actively using them.

**Common amounts:**
- 4GB - Basic usage
- 6GB - Moderate multitasking
- 8GB - Good multitasking
- 12GB+ - Heavy multitasking/gaming

**What RAM does:**
- Keeps apps running in background
- Enables smooth app switching
- Prevents apps from reloading
- Improves overall responsiveness

**RAM vs Storage:**
- RAM is temporary (cleared when phone restarts)
- Storage is permanent (keeps your files)
- You can't increase RAM later
- More RAM doesn't always mean faster (depends on optimization)`;
  }

  // Storage
  if (lowerQuery.includes("storage") || lowerQuery.includes("internal memory") || lowerQuery.includes("rom")) {
    return `**Internal Storage (ROM)**

Internal storage is your phone's permanent memory where all your apps, photos, videos, and files are stored.

**Common amounts:**
- 64GB - Basic usage (fills up quickly)
- 128GB - Standard (comfortable for most users)
- 256GB - Spacious (good for media lovers)
- 512GB+ - Very spacious (for heavy users)

**What uses storage:**
- Apps and games (1-5GB each)
- Photos and videos
- Music and movies
- System files (takes 10-20GB)

**Tips:**
- Consider expandable storage (microSD card support)
- Cloud storage can supplement
- 128GB is the sweet spot for most users
- Can't be upgraded later (except via microSD if supported)`;
  }

  // 5G
  if (lowerQuery.includes("5g") || lowerQuery.includes("5 g")) {
    return `**5G Connectivity**

5G is the fifth generation of mobile network technology, offering significantly faster internet speeds and lower latency compared to 4G.

**Key benefits:**
- Much faster download/upload speeds (up to 10-20x faster than 4G)
- Lower latency (lag) - better for gaming and video calls
- Better performance in crowded areas
- Future-proof for next few years

**Real-world impact:**
- Download movies in seconds
- Seamless HD video streaming
- Better gaming experience
- Faster uploads to social media

**Considerations:**
- Requires 5G network coverage in your area
- Slightly higher battery drain
- More common in mid-range and flagship phones
- 5G rollout is ongoing in India (major cities have coverage)`;
  }

  // NFC
  if (lowerQuery.includes("nfc")) {
    return `**NFC (Near Field Communication)**

NFC is a short-range wireless technology that allows your phone to communicate with other devices or tags when they're very close (usually within 4cm).

**Common uses:**
- **Contactless payments**: Google Pay, PhonePe, Paytm (tap to pay)
- **File sharing**: Quick transfer to other NFC phones
- **Smart tags**: Automate tasks by tapping NFC tags
- **Pairing devices**: Quick Bluetooth pairing with speakers/headphones

**How it works:**
- Hold phone near NFC terminal/tag
- Instant communication (no pairing needed)
- Very secure for payments

**Availability:**
Common in flagship and some mid-range phones. Essential if you plan to use contactless payments.`;
  }

  // Fast Charging
  if (lowerQuery.includes("fast charg") || lowerQuery.includes("quick charg") || lowerQuery.includes("turbo charg") || lowerQuery.includes("warp charg")) {
    return `**Fast Charging**

Fast charging technology allows your phone to charge much quicker than standard charging by delivering higher power (watts).

**Common standards:**
- 18W - Basic fast charging
- 25W-33W - Standard fast charging
- 65W-100W - Super fast charging
- 120W+ - Ultra fast charging

**Real-world charging times (0-100%):**
- Standard (10W): 2-3 hours
- 18W: 1.5-2 hours
- 33W: ~1 hour
- 65W+: 30-45 minutes

**Benefits:**
- Quick top-ups (10-15 min charging adds hours of use)
- Less time tethered to charger
- Convenient for busy lifestyles

**Note:**
Check what's included in the box - some phones support fast charging but don't include the fast charger.`;
  }

  // Battery
  if (lowerQuery.includes("battery") || lowerQuery.includes("mah")) {
    return `**Battery Capacity (mAh)**

Battery capacity, measured in mAh (milliampere-hour), indicates how much power your phone's battery can store.

**Common capacities:**
- 3000-4000mAh - Small (1 day with light use)
- 4000-5000mAh - Standard (1 day with moderate use)
- 5000-6000mAh - Large (1.5-2 days)
- 6000mAh+ - Very large (2+ days)

**What affects battery life:**
- Screen size and brightness
- Refresh rate (120Hz uses more than 60Hz)
- Processor efficiency
- Usage patterns (gaming drains more than browsing)
- 5G connectivity

**Real-world expectations:**
- 5000mAh typically = 1 full day of heavy use
- Combined with fast charging for best experience
- Software optimization matters as much as capacity`;
  }

  // Camera MP
  if (lowerQuery.includes("megapixel") || lowerQuery.includes("mp camera") || lowerQuery.includes(" mp ")) {
    return `**Camera Megapixels (MP)**

Megapixels indicate the resolution of your phone's camera - how many millions of pixels the image contains.

**Common ranges:**
- 12-16MP - Standard (sufficient for most users)
- 48-50MP - High resolution (good for cropping/zooming)
- 64-108MP - Very high resolution (marketing highlight)
- 200MP - Ultra high (latest flagships)

**Important truth:**
- **More MP ≠ Better photos!**
- Sensor size, lens quality, and software processing matter MORE
- 12MP with good sensor > 108MP with poor sensor
- iPhone's 12MP cameras often beat 108MP Android cameras

**What really matters:**
- Sensor size (bigger is better)
- OIS (optical stabilization)
- Software processing (AI, HDR)
- Low-light performance
- Multiple cameras (wide, ultra-wide, telephoto)`;
  }

  // AMOLED/Display
  if (lowerQuery.includes("amoled") || lowerQuery.includes("oled") || lowerQuery.includes("lcd") || lowerQuery.includes("display type")) {
    return `**Display Types: AMOLED vs LCD**

**AMOLED (Active Matrix Organic LED):**
- Each pixel produces its own light
- True blacks (pixels turn off completely)
- Vibrant colors and high contrast
- Better battery efficiency (dark mode saves power)
- More expensive
- Found in: Samsung, OnePlus, most flagships

**LCD (Liquid Crystal Display):**
- Backlight illuminates all pixels
- Good color accuracy
- No true blacks (backlight always on)
- Generally cheaper
- More common in budget phones
- Found in: Many Xiaomi, Realme budget models

**Which is better?**
- AMOLED for media consumption, vibrant colors
- LCD is still excellent for everyday use
- AMOLED premium is worth it if budget allows`;
  }

  // Generic fallback - should rarely be reached now
  return `I'd be happy to explain that mobile phone concept! However, I'm having trouble accessing my explanation database right now. 

You can try:
1. Searching online for "${query}"
2. Asking a more specific question about the feature
3. Asking me to compare specific phones that have this feature

I can still help you find phones, compare models, and make recommendations based on your needs!`;
}

/**
 * Generates a detailed response about a specific phone model
 * @param phone - The phone to describe
 * @param originalQuery - The user's original query
 * @returns Promise<string> - Formatted details text
 */
export async function generatePhoneDetailsResponse(phone: Mobile, originalQuery: string): Promise<string> {
  const phoneData = {
    model: phone.model,
    brand: phone.brand_name,
    price: `₹${phone.price.toLocaleString()}`,
    rating: `${phone.rating}/100`,
    specs: {
      camera: `${phone.primary_camera_rear}MP rear, ${phone.primary_camera_front}MP front`,
      battery: `${phone.battery_capacity}mAh${phone.fast_charging_available ? ' with fast charging' : ''}`,
      ram: `${phone.ram_capacity}GB RAM`,
      storage: `${phone.internal_memory}GB${phone.extended_memory_available ? ` (expandable up to ${phone.extended_upto}GB)` : ''}`,
      display: `${phone.screen_size}" screen, ${phone.refresh_rate}Hz refresh rate, ${phone.resolution_width}x${phone.resolution_height}`,
      processor: `${phone.num_cores}-core processor`,
      cameras: `${phone.num_rear_cameras} rear + ${phone.num_front_cameras} front cameras`,
      os: phone.os.toUpperCase(),
      connectivity: `${phone.has_5g ? '5G' : '4G'}${phone.has_nfc ? ', NFC' : ''}${phone.has_ir_blaster ? ', IR Blaster' : ''}`,
    }
  };

  const prompt = `The user asked: "${originalQuery}"

They want to know about this phone:
${JSON.stringify(phoneData, null, 2)}

Provide a comprehensive, engaging explanation of this phone's technical features:
1. Start with a brief introduction of the phone
2. Highlight the key technical specifications (camera, battery, display, performance)
3. Explain what these specs mean in real-world usage
4. Mention any standout features
5. Suggest what type of user this phone is good for
6. Keep it natural and conversational

Focus on helping the user understand if this phone meets their needs.`;

  try {
    const response = await generateResponse(prompt, SYSTEM_PROMPT);
    
    // If response is empty or too short, use fallback
    if (!response || response.trim().length < 100) {
      console.warn('[Details Response] AI response too short, using fallback');
      return generateSimplePhoneDetails(phone);
    }
    
    return response;
  } catch (error) {
    console.error('[Details Response] AI generation failed:', error);
    return generateSimplePhoneDetails(phone);
  }
}

function generateSimplePhoneDetails(phone: Mobile): string {
  let response = `**${phone.model}** - ₹${phone.price.toLocaleString()}\n\n`;
  
  // Add "Why this phone" section
  response += `**Why Consider This Phone?**\n`;
  const reasons = [];
  
  if (phone.primary_camera_rear >= 50) {
    reasons.push(`${phone.primary_camera_rear}MP camera system delivers excellent photo quality, perfect for photography enthusiasts`);
  } else if (phone.primary_camera_rear >= 40) {
    reasons.push(`${phone.primary_camera_rear}MP camera provides good photo quality for everyday use`);
  } else {
    reasons.push(`${phone.primary_camera_rear}MP camera handles daily photography needs well`);
  }
  
  if (phone.battery_capacity >= 5000) {
    reasons.push(`${phone.battery_capacity}mAh battery ensures all-day power${phone.fast_charging_available ? ' with fast charging support' : ''}`);
  } else if (phone.battery_capacity >= 4500) {
    reasons.push(`${phone.battery_capacity}mAh battery provides reliable power through the day`);
  }
  
  if (phone.ram_capacity >= 8) {
    reasons.push(`${phone.ram_capacity}GB RAM enables smooth multitasking and gaming`);
  } else if (phone.ram_capacity >= 6) {
    reasons.push(`${phone.ram_capacity}GB RAM handles everyday apps and moderate multitasking`);
  }
  
  if (phone.refresh_rate >= 120) {
    reasons.push(`${phone.refresh_rate}Hz display offers ultra-smooth scrolling and animations`);
  } else if (phone.refresh_rate >= 90) {
    reasons.push(`${phone.refresh_rate}Hz display provides fluid visuals`);
  }
  
  if (phone.has_5g) {
    reasons.push(`5G connectivity keeps you future-ready`);
  }
  
  reasons.forEach(reason => {
    response += `• ${reason}\n`;
  });
  response += '\n';
  
  // Add detailed specs
  response += `📱 **Detailed Specifications:**\n\n`;
  response += `• **Camera System**: ${phone.primary_camera_rear}MP main (${phone.num_rear_cameras} rear cameras) + ${phone.primary_camera_front}MP front\n`;
  response += `• **Battery**: ${phone.battery_capacity}mAh${phone.fast_charging_available ? ' with fast charging' : ''}\n`;
  response += `• **Memory**: ${phone.ram_capacity}GB RAM, ${phone.internal_memory}GB storage${phone.extended_memory_available ? ` (expandable to ${phone.extended_upto}GB)` : ''}\n`;
  response += `• **Display**: ${phone.screen_size}" screen with ${phone.refresh_rate}Hz refresh rate (${phone.resolution_width}x${phone.resolution_height})\n`;
  response += `• **Processor**: ${phone.num_cores}-core processor\n`;
  response += `• **OS**: ${phone.os.toUpperCase()}\n`;
  response += `• **Connectivity**: ${phone.has_5g ? '5G' : '4G'}${phone.has_nfc ? ', NFC' : ''}${phone.has_ir_blaster ? ', IR Blaster' : ''}\n`;
  response += `• **Overall Rating**: ${phone.rating}/100\n\n`;
  
  // Add recommendation
  response += `**Best For:** `;
  const bestFor = [];
  if (phone.primary_camera_rear >= 50) bestFor.push("photography");
  if (phone.battery_capacity >= 5000) bestFor.push("heavy usage");
  if (phone.ram_capacity >= 8) bestFor.push("gaming and multitasking");
  if (phone.refresh_rate >= 90) bestFor.push("smooth media consumption");
  
  if (bestFor.length > 0) {
    response += bestFor.join(", ");
  } else {
    response += "everyday use and general tasks";
  }
  
  return response;
}

/**
 * Generates a general response for queries that don't fit other categories
 * @param query - The user's query
 * @returns Promise<string> - Formatted response text
 */
export async function generateGeneralResponse(query: string): Promise<string> {
  const lowerQuery = query.toLowerCase();
  
  // Check if user is asking about bot capabilities
  if (
    lowerQuery.includes("what can you") ||
    lowerQuery.includes("what do you") ||
    lowerQuery.includes("help") ||
    lowerQuery.includes("hello") ||
    lowerQuery.includes("hi") ||
    lowerQuery.includes("capabilities")
  ) {
    return `👋 Hello! I'm PhonePixie, your AI-powered mobile shopping assistant!

**Here's what I can help you with:**

🔍 **Search & Recommend**
- Find phones based on your budget (e.g., "Best phone under ₹30k")
- Filter by features (camera, battery, 5G, gaming)
- Filter by brands (Samsung, OnePlus, Xiaomi, etc.)

⚖️ **Compare Phones**
- Compare 2-3 phones side by side
- Analyze specs, features, and trade-offs
- Example: "Compare Pixel 8a vs OnePlus 12R"

📚 **Explain Technology**
- Understand technical terms (OIS, EIS, refresh rate, processor)
- Learn about phone features
- Example: "What is OIS?" or "Explain refresh rate"

💡 **Smart Recommendations**
- Get personalized suggestions based on your needs
- Budget-aware recommendations
- Feature-based matching

**Try asking me:**
• "Show me gaming phones under ₹40k"
• "Best camera phone for photography"
• "Compare iPhone 13 vs Samsung S21"
• "What's the difference between OIS and EIS?"
• "Samsung phones with 120Hz display under ₹25k"

What would you like to know about mobile phones?`;
  }
  
  try {
    const response = await generateResponse(query, SYSTEM_PROMPT);
    return response;
  } catch (error) {
    return "I'm here to help you find the perfect mobile phone. What are you looking for?";
  }
}

