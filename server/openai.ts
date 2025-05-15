import OpenAI from "openai";
import fs from "fs";
import path from "path";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
let openai: OpenAI | null = null;

try {
  // Only initialize OpenAI if we have an API key
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    console.log("OpenAI client initialized successfully");
    
    // Test the API key by making a small request
    (async () => {
      try {
        await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [{ role: "user", content: "Test" }],
          max_tokens: 5
        });
        console.log("OpenAI API key verified successfully");
      } catch (error: any) {
        console.error("OpenAI API key validation failed:", error.message);
        console.warn("OpenAI features will use fallback data due to invalid API key");
        openai = null;
      }
    })();
  } else {
    console.warn("No OPENAI_API_KEY environment variable found. OpenAI features will use fallback data.");
  }
} catch (error) {
  console.error("Error initializing OpenAI client:", error);
  console.warn("OpenAI features will use fallback data due to initialization error");
}

// Function to extract text from PDF or DOCX files
async function extractTextFromDocument(filePath: string): Promise<string> {
<<<<<<< HEAD
  try {
    // In a production environment, you would use libraries like pdf-parse or mammoth
    // to extract text from PDFs and DOCX files respectively.
    // For simplicity in this implementation, we'll return a simulated extraction
    
    // Read the first few KB of the file to determine file type
    const buffer = Buffer.alloc(4096);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 4096, 0);
    fs.closeSync(fd);
    
    // Simple check for file type (basic implementation)
    const isPdf = buffer.slice(0, 4).toString() === '%PDF';
    const filename = path.basename(filePath);
    const filenameNoExt = path.basename(filePath, path.extname(filePath));
    
    // Generate content based on filename to make it more relevant
    let topic = "science topics";
    
    if (filename.toLowerCase().includes("plant")) {
      topic = "plants and their life cycles";
    } else if (filename.toLowerCase().includes("animal")) {
      topic = "animals and their habitats";
    } else if (filename.toLowerCase().includes("math")) {
      topic = "basic mathematics";
    } else if (filename.toLowerCase().includes("language")) {
      topic = "language and vocabulary";
    }
    
    // We're simulating text extraction here
    return `Study material about ${topic} for Standard 1 students extracted from ${filename}.
      
      This material was designed to help young students learn about ${topic}.
      
      It contains important information that will help children understand:
      - Basic concepts and facts about ${topic}
      - How to identify and classify different types of ${topic.split(' ')[0]}
      - Interactive activities to reinforce learning
      
      Plants need sunlight, water, and soil to grow healthy.
      Animals need food, water, and shelter to survive.
      Students learn best when they can relate concepts to their daily lives.
      
      Standard 1 students in Malaysia are at a critical stage of development
      where they build fundamental knowledge that will support future learning.`;
  } catch (err) {
    const error = err as Error;
    console.error(`Error extracting text from document: ${error.message || 'Unknown error'}`);
    throw new Error(`Failed to extract text from document: ${error.message || 'Unknown error'}`);
  }
=======
  // In a production environment, you would use libraries like pdf-parse or mammoth
  //  to extract text from PDFs and DOCX files respectively.
  
  // Read the first few KB of the file to determine file type
  const buffer = Buffer.alloc(4096);
  const fd = fs.openSync(filePath, 'r');
  fs.readSync(fd, buffer, 0, 4096, 0);
  fs.closeSync(fd);
  
  // Simple check for file type (basic implementation)
  const isPdf = buffer.slice(0, 4).toString() === '%PDF';
  
  // Read the actual file content
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Return the actual content instead of mock data
  return content;
>>>>>>> 37a751984f3548f5d683088ca45e79327fc6d778
}

// Function to generate a quiz based on study material content
export async function generateQuiz(textContent: string, level: string): Promise<any> {
  try {
    // Verify API key exists
    if (!process.env.OPENAI_API_KEY) {
      console.warn("No OpenAI API key found. Using fallback quiz data.");
      return generateFallbackQuiz(textContent, level);
    }
    
    // Prepare the prompt based on difficulty level
    const difficultyDescription = level === "Beginner" ? 
      "simple with basic vocabulary and straightforward questions" : 
      level === "Intermediate" ? 
      "moderate difficulty with more detailed questions" : 
      "challenging but still appropriate for 7-year-old Malaysian students";
    
    const prompt = `
      Generate a multiple-choice quiz with 5 questions based on the following study material.
      
      The quiz should be:
      - Child-friendly and appropriate for 7-year-old Malaysian students
      - At ${level} level (${difficultyDescription})
      - Clear and easy to understand
      - Have 4 options for each question with only one correct answer
      - ONLY use information from the provided study material
      
      Format your response as a JSON object with the following structure:
      [
        {
          "question": "Question text here?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswerIndex": 0, // Index of the correct answer (0-3)
          "explanation": "Short explanation of the correct answer"
        },
        // more questions...
      ]
      
      Study material:
      ${textContent}
    `;

<<<<<<< HEAD
    try {
      // Check if OpenAI client is initialized
      if (!openai) {
        console.warn("OpenAI client not initialized. Using fallback quiz data.");
        return generateFallbackQuiz(textContent, level);
      }
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are an educational quiz generator for young children." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });
  
      const content = response.choices[0].message.content;
      if (!content) {
        console.error("Empty response received from OpenAI");
        throw new Error("Failed to generate quiz: Empty response from OpenAI");
      }
      
      // Extensive logging for debugging
      console.log("OpenAI response received, content length:", content.length);
      
      let parsedContent;
      try {
        // Validate that the content is valid JSON
        parsedContent = JSON.parse(content);
        console.log("Successfully parsed OpenAI response as JSON");
      } catch (error) {
        const parseError = error as Error;
        console.error("Failed to parse OpenAI response as JSON:", parseError);
        throw new Error(`Failed to parse OpenAI response: ${parseError.message}`);
      }
      
      // Validate the returned content matches one of our expected structures
      console.log("Validating OpenAI response format...");
      
      let questions;
      if (Array.isArray(parsedContent)) {
        // If the response is already an array, use it directly
        console.log("Response is a direct array of questions");
        questions = parsedContent;
      } else if (parsedContent.questions && Array.isArray(parsedContent.questions)) {
        // If the response has a 'questions' array, use that
        console.log("Response contains a 'questions' array property");
        questions = parsedContent.questions;
      } else {
        console.error("Unexpected response format:", JSON.stringify(parsedContent).substring(0, 200) + "...");
        throw new Error("Invalid quiz format returned from OpenAI - expected array of questions");
      }
      
      // Return the questions array
      return questions;
    } catch (apiError) {
      console.error("OpenAI API error:", apiError);
      console.warn("Using fallback quiz data due to OpenAI API error");
      return generateFallbackQuiz(textContent, level);
=======
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an educational quiz generator for young children. Only use information from the provided study material to create questions." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8 // Increase randomness to get different questions each time
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Failed to generate quiz: Empty response from OpenAI");
>>>>>>> 37a751984f3548f5d683088ca45e79327fc6d778
    }
  } catch (err) {
    const error = err as Error;
    console.error("Error generating quiz:", error);
    
    // Always provide a fallback quiz in case of errors
    console.warn("Using fallback quiz data due to error");
    return generateFallbackQuiz(textContent, level);
  }
}

// Function to generate fallback quiz data when OpenAI API is unavailable
function generateFallbackQuiz(textContent: string, level: string): any {
  console.log("Generating fallback quiz for text content:", textContent.substring(0, 50) + "...");
  
  // Extract potential topic from the content
  const contentLower = textContent.toLowerCase();
  let topic = "general knowledge";
  
  if (contentLower.includes("plant")) {
    topic = "plants";
  } else if (contentLower.includes("animal")) {
    topic = "animals";
  } else if (contentLower.includes("math")) {
    topic = "mathematics";
  } else if (contentLower.includes("language")) {
    topic = "language";
  }
  
  console.log(`Topic identified for fallback quiz: ${topic}`);
  
  // Create different difficulty levels
  const difficulty = level === "Beginner" ? 0 : 
                    level === "Intermediate" ? 1 : 2;
  
  // Generate appropriate fallback questions
  if (topic === "plants") {
    return generatePlantQuestions(difficulty);
  } else if (topic === "animals") {
    return generateAnimalQuestions(difficulty);
  } else if (topic === "mathematics") {
    return generateMathQuestions(difficulty);
  } else if (topic === "language") {
    return generateLanguageQuestions(difficulty);
  } else {
    return generateGeneralQuestions(difficulty);
  }
}

function generatePlantQuestions(difficulty: number): any {
  if (difficulty === 0) {
    return [
      {
        question: "What do plants need to grow?",
        options: ["Sunlight and water", "Ice cream", "Television", "Bicycles"],
        correctAnswerIndex: 0,
        explanation: "Plants need sunlight and water to grow healthy."
      },
      {
        question: "Which part of the plant is usually green?",
        options: ["Roots", "Leaves", "Flowers", "Fruits"],
        correctAnswerIndex: 1,
        explanation: "Leaves are usually green because they contain chlorophyll for photosynthesis."
      },
      {
        question: "Where do plants get water from?",
        options: ["From the soil", "From the air", "From other plants", "From animals"],
        correctAnswerIndex: 0,
        explanation: "Plants absorb water from the soil through their roots."
      },
      {
        question: "What do the roots of a plant do?",
        options: ["Make food", "Hold the plant in the soil", "Make flowers", "Make fruit"],
        correctAnswerIndex: 1,
        explanation: "Roots hold the plant firmly in the soil and absorb water and nutrients."
      },
      {
        question: "What is the colorful part of many plants that bees visit?",
        options: ["Stem", "Leaf", "Flower", "Root"],
        correctAnswerIndex: 2,
        explanation: "Flowers are often colorful to attract bees and other pollinators."
      }
    ];
  } else {
    // More advanced questions for higher difficulties
    return [
      {
        question: "What process do plants use to make their own food?",
        options: ["Digestion", "Photosynthesis", "Respiration", "Transpiration"],
        correctAnswerIndex: 1,
        explanation: "Plants use photosynthesis to make food using sunlight, water, and carbon dioxide."
      },
      {
        question: "Which part of the plant carries water from the roots to the leaves?",
        options: ["Flowers", "Fruits", "Stems", "Seeds"],
        correctAnswerIndex: 2,
        explanation: "Stems carry water and nutrients from the roots to other parts of the plant."
      },
      {
        question: "What do we call it when a seed starts to grow?",
        options: ["Germination", "Photosynthesis", "Pollination", "Respiration"],
        correctAnswerIndex: 0,
        explanation: "Germination is when a seed begins to grow and develop into a seedling."
      },
      {
        question: "What gas do plants take in from the air to make food?",
        options: ["Oxygen", "Carbon dioxide", "Nitrogen", "Hydrogen"],
        correctAnswerIndex: 1,
        explanation: "Plants take in carbon dioxide from the air during photosynthesis."
      },
      {
        question: "What do plants produce that humans and animals breathe in?",
        options: ["Carbon dioxide", "Nitrogen", "Oxygen", "Hydrogen"],
        correctAnswerIndex: 2,
        explanation: "Plants release oxygen during photosynthesis, which humans and animals breathe."
      }
    ];
  }
}

function generateAnimalQuestions(difficulty: number): any {
  // Similar structure to the plant questions, but with animal-focused content
  if (difficulty === 0) {
    return [
      {
        question: "Which animal has a very long neck?",
        options: ["Elephant", "Giraffe", "Tiger", "Crocodile"],
        correctAnswerIndex: 1,
        explanation: "Giraffes have very long necks that help them eat leaves from tall trees."
      },
      {
        question: "What do birds use to fly?",
        options: ["Legs", "Tails", "Wings", "Paws"],
        correctAnswerIndex: 2,
        explanation: "Birds use their wings to fly."
      },
      {
        question: "Which animal swims in the ocean?",
        options: ["Lion", "Elephant", "Fish", "Snake"],
        correctAnswerIndex: 2,
        explanation: "Fish live in water and can swim in oceans, rivers, and lakes."
      },
      {
        question: "Which animal has a shell?",
        options: ["Dog", "Turtle", "Bird", "Monkey"],
        correctAnswerIndex: 1,
        explanation: "Turtles have shells that protect their bodies."
      },
      {
        question: "What do most animals need to stay alive?",
        options: ["Food and water", "Cars", "Television", "Computers"],
        correctAnswerIndex: 0,
        explanation: "Animals need food and water to survive, just like humans."
      }
    ];
  } else {
    // More advanced animal questions for higher difficulties
    return [
      {
        question: "Which group of animals have scales?",
        options: ["Mammals", "Birds", "Reptiles", "Amphibians"],
        correctAnswerIndex: 2,
        explanation: "Reptiles like snakes, lizards, and crocodiles have scales on their skin."
      },
      {
        question: "What do we call animals that only eat plants?",
        options: ["Carnivores", "Herbivores", "Omnivores", "Insectivores"],
        correctAnswerIndex: 1,
        explanation: "Herbivores are animals that only eat plants."
      },
      {
        question: "Which animal is a marsupial?",
        options: ["Elephant", "Kangaroo", "Tiger", "Dolphin"],
        correctAnswerIndex: 1,
        explanation: "Kangaroos are marsupials, which carry their babies in pouches."
      },
      {
        question: "What special ability do bats have?",
        options: ["They can see through walls", "They can fly", "They can breathe underwater", "They can change colors"],
        correctAnswerIndex: 1,
        explanation: "Bats are mammals that can fly using their wings."
      },
      {
        question: "What are baby frogs called?",
        options: ["Kittens", "Calves", "Tadpoles", "Larvae"],
        correctAnswerIndex: 2,
        explanation: "Baby frogs are called tadpoles and live in water before they grow legs."
      }
    ];
  }
}

function generateMathQuestions(difficulty: number): any {
  // Math questions appropriate for Standard 1 students
  if (difficulty === 0) {
    return [
      {
        question: "What is 3 + 2?",
        options: ["4", "5", "6", "7"],
        correctAnswerIndex: 1,
        explanation: "3 + 2 = 5"
      },
      {
        question: "Count the objects: 🍎🍎🍎. How many apples are there?",
        options: ["2", "3", "4", "5"],
        correctAnswerIndex: 1,
        explanation: "There are 3 apple emojis in the picture."
      },
      {
        question: "Which number comes after 7?",
        options: ["6", "7", "8", "9"],
        correctAnswerIndex: 2,
        explanation: "The number 8 comes after 7 when counting."
      },
      {
        question: "What shape is this: ⭐?",
        options: ["Circle", "Square", "Triangle", "Star"],
        correctAnswerIndex: 3,
        explanation: "The shape is a star."
      },
      {
        question: "If you have 2 candies and get 3 more, how many do you have?",
        options: ["4", "5", "6", "7"],
        correctAnswerIndex: 1,
        explanation: "2 candies + 3 more candies = 5 candies in total."
      }
    ];
  } else {
    // More advanced math questions
    return [
      {
        question: "What is 5 + 7?",
        options: ["10", "11", "12", "13"],
        correctAnswerIndex: 2,
        explanation: "5 + 7 = 12"
      },
      {
        question: "If you have 10 marbles and give away 4, how many do you have left?",
        options: ["4", "5", "6", "7"],
        correctAnswerIndex: 2,
        explanation: "10 marbles - 4 marbles = 6 marbles remaining."
      },
      {
        question: "Which number is greater than 15?",
        options: ["12", "13", "14", "16"],
        correctAnswerIndex: 3,
        explanation: "16 is greater than 15."
      },
      {
        question: "How many sides does a triangle have?",
        options: ["2", "3", "4", "5"],
        correctAnswerIndex: 1,
        explanation: "A triangle has 3 sides."
      },
      {
        question: "What is 8 - 3?",
        options: ["3", "4", "5", "6"],
        correctAnswerIndex: 2,
        explanation: "8 - 3 = 5"
      }
    ];
  }
}

function generateLanguageQuestions(difficulty: number): any {
  // Language questions for Malaysian Standard 1 students
  if (difficulty === 0) {
    return [
      {
        question: "Which word starts with the letter 'A'?",
        options: ["Dog", "Cat", "Ball", "Apple"],
        correctAnswerIndex: 3,
        explanation: "Apple starts with the letter 'A'."
      },
      {
        question: "How many letters are in the word 'cat'?",
        options: ["2", "3", "4", "5"],
        correctAnswerIndex: 1,
        explanation: "The word 'cat' has 3 letters: c, a, and t."
      },
      {
        question: "Which is a color?",
        options: ["Dog", "Book", "Blue", "Table"],
        correctAnswerIndex: 2,
        explanation: "Blue is a color."
      },
      {
        question: "Which animal says 'meow'?",
        options: ["Dog", "Cat", "Fish", "Bird"],
        correctAnswerIndex: 1,
        explanation: "Cats make the sound 'meow'."
      },
      {
        question: "Which word means the opposite of 'big'?",
        options: ["Huge", "Large", "Small", "Tall"],
        correctAnswerIndex: 2,
        explanation: "Small is the opposite of big."
      }
    ];
  } else {
    // More advanced language questions
    return [
      {
        question: "What is a group of words that makes a complete thought?",
        options: ["Word", "Letter", "Sentence", "Paragraph"],
        correctAnswerIndex: 2,
        explanation: "A sentence is a group of words that makes a complete thought."
      },
      {
        question: "Which punctuation mark ends a question?",
        options: ["Period (.)", "Question mark (?)", "Comma (,)", "Exclamation point (!)"],
        correctAnswerIndex: 1,
        explanation: "A question mark (?) is used at the end of a question."
      },
      {
        question: "What is the past tense of 'walk'?",
        options: ["Walking", "Walked", "Walks", "Will walk"],
        correctAnswerIndex: 1,
        explanation: "The past tense of 'walk' is 'walked'."
      },
      {
        question: "Which word is a noun?",
        options: ["Run", "Jump", "Happy", "Book"],
        correctAnswerIndex: 3,
        explanation: "Book is a noun, which is a person, place, or thing."
      },
      {
        question: "What is a word that describes a noun?",
        options: ["Adjective", "Verb", "Pronoun", "Adverb"],
        correctAnswerIndex: 0,
        explanation: "An adjective is a word that describes a noun."
      }
    ];
  }
}

function generateGeneralQuestions(difficulty: number): any {
  // General knowledge questions
  if (difficulty === 0) {
    return [
      {
        question: "Which of these is a fruit?",
        options: ["Carrot", "Potato", "Apple", "Broccoli"],
        correctAnswerIndex: 2,
        explanation: "An apple is a fruit."
      },
      {
        question: "What do we use to write?",
        options: ["Pencil", "Fork", "Plate", "Chair"],
        correctAnswerIndex: 0,
        explanation: "We use a pencil to write."
      },
      {
        question: "Which animal can fly?",
        options: ["Fish", "Dog", "Bird", "Cat"],
        correctAnswerIndex: 2,
        explanation: "Birds can fly using their wings."
      },
      {
        question: "What do we drink when we are thirsty?",
        options: ["Sand", "Water", "Rocks", "Soil"],
        correctAnswerIndex: 1,
        explanation: "We drink water when we are thirsty."
      },
      {
        question: "What shape is a ball?",
        options: ["Square", "Triangle", "Circle", "Rectangle"],
        correctAnswerIndex: 2,
        explanation: "A ball is a sphere, which is a 3D circle."
      }
    ];
  } else {
    // More advanced general knowledge questions
    return [
      {
        question: "What is the capital city of Malaysia?",
        options: ["Penang", "Johor Bahru", "Kuala Lumpur", "Ipoh"],
        correctAnswerIndex: 2,
        explanation: "Kuala Lumpur is the capital city of Malaysia."
      },
      {
        question: "Which of these is not a season?",
        options: ["Summer", "Winter", "Autumn", "Malaysia"],
        correctAnswerIndex: 3,
        explanation: "Malaysia is a country, not a season. The seasons are summer, winter, autumn, and spring."
      },
      {
        question: "Which sense do we use with our eyes?",
        options: ["Hearing", "Smell", "Sight", "Taste"],
        correctAnswerIndex: 2,
        explanation: "We use our eyes for the sense of sight."
      },
      {
        question: "What is needed to make a rainbow appear in the sky?",
        options: ["Sun and rain", "Moon and stars", "Snow and wind", "Clouds and lightning"],
        correctAnswerIndex: 0,
        explanation: "A rainbow appears when there is both sun and rain."
      },
      {
        question: "What do plants produce that helps fruits grow?",
        options: ["Leaves", "Flowers", "Branches", "Roots"],
        correctAnswerIndex: 1,
        explanation: "Flowers eventually develop into fruits on many plants."
      }
    ];
  }
}

// Function to generate study recommendations based on quiz performance
export async function generateStudyRecommendations(
  studentName: string,
  materialTitle: string,
  score: number,
  incorrectQuestions: any[]
): Promise<string> {
  try {
    // Generate personalized recommendations based on score
    let baseRecommendation = "";
    if (score >= 80) {
      baseRecommendation = `Great job, ${studentName}! You've shown excellent understanding of ${materialTitle}.`;
    } else if (score >= 60) {
      baseRecommendation = `Good work, ${studentName}! You're making progress in understanding ${materialTitle}.`;
    } else {
      baseRecommendation = `Keep going, ${studentName}! With more practice, you'll improve your understanding of ${materialTitle}.`;
    }

    // Verify that an OpenAI API key exists
    if (!process.env.OPENAI_API_KEY) {
      console.warn("No OpenAI API key found. Using default recommendation.");
      return `${baseRecommendation} We recommend reviewing the material again and practicing regularly.`;
    }

    const prompt = `
      Create personalized study recommendations for a 7-year-old Malaysian student named ${studentName} 
      who just completed a quiz on "${materialTitle}".
      
      Quiz performance details:
      - Overall score: ${score}%
      - Questions answered incorrectly:
      ${incorrectQuestions.map(q => `- ${q.question}`).join('\n')}
      
      Provide 2-3 specific recommendations on what to focus on next, written in a friendly, encouraging tone.
      Keep the language simple and appropriate for a 7-year-old. Be specific about the topics that need more study
      based on the incorrect answers and the material title.
    `;

    // Check if OpenAI client is initialized
    if (!openai) {
      console.warn("OpenAI client not initialized. Using default recommendation.");
      return `${baseRecommendation} Try to focus on the main concepts and ask your teacher if you need help.`;
    }
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are an educational coach for young children in Malaysia." },
          { role: "user", content: prompt }
        ],
        max_tokens: 300,
        temperature: 0.7
      });

      const aiRecommendation = response.choices[0].message.content;
      if (!aiRecommendation || aiRecommendation.trim() === "") {
        throw new Error("Empty response from OpenAI API");
      }

      return aiRecommendation;
    } catch (apiError) {
      console.error("OpenAI API error:", apiError);
      console.warn("Using fallback recommendation due to OpenAI API error");
      
      // Return more specific fallback based on subject and score
      let topicSpecificAdvice = "";
      const lowerTitle = materialTitle.toLowerCase();
      
      if (lowerTitle.includes("math")) {
        topicSpecificAdvice = "Practice counting and simple calculations daily.";
      } else if (lowerTitle.includes("science") || lowerTitle.includes("plant") || lowerTitle.includes("animal")) {
        topicSpecificAdvice = "Try observing plants and animals around you to understand them better.";
      } else if (lowerTitle.includes("language") || lowerTitle.includes("read")) {
        topicSpecificAdvice = "Read more stories and practice writing simple sentences.";
      } else {
        topicSpecificAdvice = "Review the important points in your textbook and notes.";
      }
      
      return `${baseRecommendation} ${topicSpecificAdvice} Keep up the good work!`;
    }
  } catch (err) {
    const error = err as Error;
    console.error("Error generating recommendations:", error);
    return `You're doing well! Keep practicing and reviewing ${materialTitle}. Ask your teacher when you need help.`;
  }
}

export { extractTextFromDocument };