'use server';

/**
 * @fileOverview Flow for user management, allowing admins to create new users.
 *
 * - createUser - Creates a new user in Firebase Auth and a corresponding user profile in Firestore.
 * - CreateUserInput - The input type for the createUser function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

const CreateUserInputSchema = z.object({
  email: z.string().email().describe('The new user\'s email address.'),
  password: z.string().min(6).describe('The new user\'s password (at least 6 characters).'),
  role: z.enum(['admin', 'inspector']).describe('The role to assign to the new user.'),
  displayName: z.string().describe('The display name for the new user.')
});

export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;

const UserManagementOutputSchema = z.object({
  uid: z.string().describe("The new user's unique ID."),
  email: z.string().email().describe("The new user's email."),
  role: z.string().describe("The new user's role."),
});

// We can't use the Admin SDK, so we need a secondary Firebase App instance
// to create users without logging out the current admin.
const createUserFlow = ai.defineFlow(
  {
    name: 'createUserFlow',
    inputSchema: CreateUserInputSchema,
    outputSchema: UserManagementOutputSchema,
  },
  async (input) => {
    const { firestore } = initializeFirebase();
    // This is a workaround. In a real app, you'd use the Admin SDK on a server.
    // We create a temporary, secondary app instance to create the user.
    // This avoids signing out the currently logged-in admin.
    const { initializeApp: initializeAppSecondary, deleteApp } = await import('firebase/app');
    const { getAuth: getAuthSecondary, createUserWithEmailAndPassword: createUserSecondary } = await import('firebase/auth');
    
    const tempAppName = `create-user-${Date.now()}`;
    const secondaryApp = initializeAppSecondary(initializeFirebase().firebaseApp.options, tempAppName);
    const secondaryAuth = getAuthSecondary(secondaryApp);

    try {
      const userCredential = await createUserSecondary(secondaryAuth, input.email, input.password);
      const user = userCredential.user;

      if (!user) {
        throw new Error('User creation failed in Firebase Auth.');
      }
      
      // Now, create the user profile in Firestore
      const userRef = doc(firestore, 'users', user.uid);
      await setDoc(userRef, {
        email: user.email,
        role: input.role,
        displayName: input.displayName
      });
      
      return {
        uid: user.uid,
        email: user.email!,
        role: input.role,
      };
    } catch (error: any) {
        // Handle specific Firebase errors
        if (error.code === 'auth/email-already-in-use') {
            throw new Error('Este email já está em uso por outra conta.');
        }
        if (error.code === 'auth/weak-password') {
            throw new Error('A senha é muito fraca. Por favor, use pelo menos 6 caracteres.');
        }
      throw new Error(error.message || 'An unknown error occurred during user creation.');
    } finally {
        // Clean up the temporary app instance
        await deleteApp(secondaryApp);
    }
  }
);

export async function createUser(input: CreateUserInput) {
    return await createUserFlow(input);
}
