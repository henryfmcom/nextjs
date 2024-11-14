'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';

export type AuthState = 'signin' | 'signup' | 'forgot_password';

interface AuthFormProps {
  state?: AuthState;
}

export default function AuthForm({ state = 'signin' }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [authState, setAuthState] = useState<AuthState>(state);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      let error;

      switch (authState) {
        case 'signup':
          const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
          });
          error = signUpError;
          break;
        case 'forgot_password':
          const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
          error = resetError;
          break;
        default:
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          error = signInError;
      }

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        if (authState === 'forgot_password') {
          toast({
            title: "Check your email",
            description: "We've sent you a password reset link.",
          });
        } else {
          window.location.href = '/';
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{authState === 'signup' ? 'Sign Up' : authState === 'forgot_password' ? 'Reset Password' : 'Sign In'}</CardTitle>
        <CardDescription>
          {authState === 'signup' 
            ? 'Create a new account' 
            : authState === 'forgot_password' 
              ? 'Enter your email to receive a reset link'
              : 'Enter your credentials to access your account'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {authState !== 'forgot_password' && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            type="submit" 
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Processing...' : authState === 'signup' ? 'Sign Up' : authState === 'forgot_password' ? 'Send Reset Link' : 'Sign In'}
          </Button>
          <div className="text-sm text-center space-y-2">
            {authState === 'signin' && (
              <>
                <button
                  type="button"
                  onClick={() => setAuthState('forgot_password')}
                  className="text-primary hover:underline"
                >
                  Forgot password?
                </button>
                <div>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setAuthState('signup')}
                    className="text-primary hover:underline"
                  >
                    Sign up
                  </button>
                </div>
              </>
            )}
            {(authState === 'signup' || authState === 'forgot_password') && (
              <button
                type="button"
                onClick={() => setAuthState('signin')}
                className="text-primary hover:underline"
              >
                Back to sign in
              </button>
            )}
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
