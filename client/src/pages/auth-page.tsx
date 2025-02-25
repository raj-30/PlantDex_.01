import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, InsertUser } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sprout } from "lucide-react";
import { useLocation } from "wouter";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();

  if (user) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sprout className="h-6 w-6" />
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                PlantDex
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <AuthForm type="login" />
              </TabsContent>
              <TabsContent value="register">
                <AuthForm type="register" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      <div className="hidden md:flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 p-8">
        <div className="max-w-md space-y-4">
          <h1 className="text-4xl font-bold text-green-900">
            Your Digital Plant Collection
          </h1>
          <p className="text-green-700">
            Scan, identify, and collect beautiful plant cards. Build your personal botanical library with PlantDex.
          </p>
        </div>
      </div>
    </div>
  );
}

function AuthForm({ type }: { type: "login" | "register" }) {
  const { loginMutation, registerMutation } = useAuth();
  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    if (type === "login") {
      loginMutation.mutate(data);
    } else {
      registerMutation.mutate(data);
    }
  });

  const isPending = loginMutation.isPending || registerMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-4 mt-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {type === "login" ? "Sign In" : "Create Account"}
        </Button>
      </form>
    </Form>
  );
}
