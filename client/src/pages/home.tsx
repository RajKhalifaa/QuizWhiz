import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/App";

export default function Home() {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden md:grid md:grid-cols-2 md:gap-8">
          <div className="p-8 md:p-12 flex flex-col justify-center">
            <h1 className="text-4xl font-bold text-primary mb-4">
              Welcome to QuizWhiz
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              The AI-powered educational quiz platform for Malaysian Standard 1 students. 
              Learning made fun and interactive!
            </p>
            <div className="space-y-4">
              {user ? (
                <div className="space-y-4">
                  <Link href="/subjects">
                    <Button className="w-full md:w-auto bg-primary text-white hover:bg-primary/90 text-lg py-6 px-8 rounded-xl">
                      <span className="material-icons mr-2">play_arrow</span>
                      Start Learning
                    </Button>
                  </Link>
                  
                  <Link href="/student-report">
                    <Button variant="outline" className="w-full md:w-auto text-primary border-primary hover:bg-primary/10 text-lg py-6 px-8 rounded-xl">
                      <span className="material-icons mr-2">bar_chart</span>
                      View Progress
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <Link href="/register">
                    <Button className="w-full md:w-auto bg-primary text-white hover:bg-primary/90 text-lg py-6 px-8 rounded-xl">
                      <span className="material-icons mr-2">school</span>
                      Sign Up as Student
                    </Button>
                  </Link>
                  
                  <Link href="/register?isTeacher=true">
                    <Button variant="outline" className="w-full md:w-auto text-primary border-primary hover:bg-primary/10 text-lg py-6 px-8 rounded-xl">
                      <span className="material-icons mr-2">assignment</span>
                      Sign Up as Teacher
                    </Button>
                  </Link>
                  
                  <p className="text-gray-500 mt-4">
                    Already registered? <Link href="/login" className="text-primary hover:underline">Login here</Link>
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="hidden md:block relative">
            <div className="absolute inset-0 flex items-center justify-center bg-primary/10 p-8">
              <div className="relative h-full w-full shadow-xl rounded-xl overflow-hidden">
                <svg 
                  className="w-full h-full text-primary" 
                  viewBox="0 0 400 400"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1"/>
                    </pattern>
                    <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
                      <rect width="80" height="80" fill="url(#smallGrid)"/>
                      <path d="M 80 0 L 0 0 0 80" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1"/>
                    </pattern>
                  </defs>

                  <rect width="100%" height="100%" fill="white"/>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                  
                  {/* Simple educational elements */}
                  <g transform="translate(200, 200) scale(0.8)">
                    <circle cx="0" cy="0" r="100" fill="#4A6FFF" fillOpacity="0.15" />
                    
                    {/* Math symbols */}
                    <text x="-60" y="-50" fontSize="40" fill="#4A6FFF" fontWeight="bold">+</text>
                    <text x="30" y="-50" fontSize="40" fill="#4A6FFF" fontWeight="bold">-</text>
                    <text x="-60" y="30" fontSize="40" fill="#4A6FFF" fontWeight="bold">×</text>
                    <text x="30" y="30" fontSize="40" fill="#4A6FFF" fontWeight="bold">÷</text>
                    
                    {/* Book icon */}
                    <g transform="translate(-130, -130) scale(0.1)">
                      <rect x="50" y="50" width="400" height="500" rx="20" fill="#FF8A65" />
                      <rect x="70" y="70" width="360" height="460" rx="10" fill="white" />
                      <line x1="150" y1="150" x2="350" y2="150" stroke="#DDD" strokeWidth="20" />
                      <line x1="150" y1="200" x2="350" y2="200" stroke="#DDD" strokeWidth="20" />
                      <line x1="150" y1="250" x2="350" y2="250" stroke="#DDD" strokeWidth="20" />
                      <line x1="150" y1="300" x2="250" y2="300" stroke="#DDD" strokeWidth="20" />
                    </g>
                    
                    {/* Light bulb icon */}
                    <g transform="translate(130, -130) scale(0.1)">
                      <circle cx="250" cy="200" r="150" fill="#FFCA28" />
                      <path d="M 220 350 L 220 450 L 280 450 L 280 350 Z" fill="#FFCA28" />
                      <ellipse cx="250" cy="450" rx="30" ry="10" fill="#FFCA28" />
                    </g>
                    
                    {/* Pencil icon */}
                    <g transform="translate(130, 130) scale(0.1)">
                      <path d="M 100 100 L 350 350 L 400 300 L 150 50 Z" fill="#4CAF50" />
                      <path d="M 100 100 L 150 50 L 200 100 L 150 150 Z" fill="#FFC107" />
                      <path d="M 350 350 L 400 400 L 400 300 Z" fill="#E57373" />
                    </g>
                    
                    {/* Test/quiz icon */}
                    <g transform="translate(-130, 130) scale(0.1)">
                      <rect x="100" y="50" width="300" height="400" rx="10" fill="#90CAF9" />
                      <rect x="130" y="100" width="240" height="40" rx="5" fill="white" />
                      <rect x="130" y="170" width="240" height="40" rx="5" fill="white" />
                      <rect x="130" y="240" width="240" height="40" rx="5" fill="white" />
                      <rect x="130" y="310" width="240" height="40" rx="5" fill="white" />
                      <circle cx="160" cy="120" r="10" fill="#4A6FFF" />
                      <circle cx="160" cy="190" r="10" fill="#4A6FFF" />
                      <circle cx="160" cy="260" r="10" fill="white" stroke="#4A6FFF" strokeWidth="3" />
                      <circle cx="160" cy="330" r="10" fill="white" stroke="#4A6FFF" strokeWidth="3" />
                    </g>
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <span className="material-icons text-3xl text-primary">auto_stories</span>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Interactive Learning</h3>
            <p className="text-gray-600">
              Study materials and AI-powered quizzes designed specifically for 7-year-old Malaysian students.
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
              <span className="material-icons text-3xl text-secondary">leaderboard</span>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Track Progress</h3>
            <p className="text-gray-600">
              See how you're doing with leaderboards and detailed progress reports.
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-[#66BB6A]/20 flex items-center justify-center mx-auto mb-4">
              <span className="material-icons text-3xl text-[#66BB6A]">psychology</span>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Smart Recommendations</h3>
            <p className="text-gray-600">
              Get personalized study recommendations based on your quiz performance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
