import { Link } from "wouter";
import { useAuth } from "@/App";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function NavBar() {
  const { user, logout } = useAuth();
  
  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
                <span className="material-icons text-primary text-2xl mr-2">school</span>
                <span className="ml-2 text-xl font-bold text-primary">QuizWhiz</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {(user.isTeacher || user.is_teacher) ? (
                  <Link href="/admin/dashboard" className="text-primary hover:text-primary/80">
                    Admin Dashboard
                  </Link>
                ) : (
                  <Link href="/student-report" className="text-primary hover:text-primary/80">
                    My Progress
                  </Link>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-primary font-bold">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="cursor-pointer">
                      <span className="text-textPrimary">{user.username}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer" onClick={logout}>
                      <span className="material-icons mr-2 text-sm">logout</span>
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="space-x-2">
                <Link href="/login" className="text-primary hover:text-primary/80">
                  Login
                </Link>
                <Link href="/register">
                  <Button className="bg-primary text-white hover:bg-primary/90">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
