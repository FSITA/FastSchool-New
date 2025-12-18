'use client';

import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

export default function ConfirmEmailPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
            <Card className="w-full max-w-md shadow-lg border-2 border-green-100 dark:border-green-900">
                <CardHeader className="space-y-4 text-center pb-2">
                    <div className="flex justify-center">
                        <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3">
                            <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent dark:from-green-400 dark:to-emerald-400">
                        Email confermata con successo 🎉
                    </CardTitle>
                    <CardDescription className="text-lg text-gray-700 dark:text-gray-300">
                        Congratulazioni! Hai ottenuto una prova gratuita di 2 giorni.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4 pt-4">
                    <div className="p-4 bg-muted/50 rounded-lg text-sm text-balance leading-relaxed text-muted-foreground">
                        <p>
                            Il tuo indirizzo email è stato verificato correttamente.
                        </p>
                        <p className="mt-2 text-foreground font-medium">
                            Per motivi di sicurezza e per attivare la tua prova gratuita, è necessario effettuare nuovamente l&apos;accesso manualmente.
                        </p>
                    </div>
                </CardContent>
                <CardFooter>
                    <Link
                        href="/auth/login"
                        className={cn(buttonVariants({ size: "lg", className: "w-full text-base py-6 bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500" }))}
                    >
                        Accedi ora
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
