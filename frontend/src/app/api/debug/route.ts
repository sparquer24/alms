import { NextResponse } from 'next/server';

function parseCookies(cookieHeader: string) {
    const out: Record<string, string> = {};
    if (!cookieHeader) return out;
    cookieHeader.split('; ').forEach((c) => {
        const idx = c.indexOf('=');
        if (idx > -1) {
            const k = c.slice(0, idx);
            const v = c.slice(idx + 1);
            try {
                out[k] = decodeURIComponent(v);
            } catch {
                out[k] = v;
            }
        }
    });
    return out;
}

export async function GET(req: Request) {
    const cookieHeader = req.headers.get('cookie') || '';
    const cookies = parseCookies(cookieHeader);

    let user: any = null;
    if (cookies.user) {
        try {
            user = JSON.parse(cookies.user);
        } catch {
            user = cookies.user;
        }
    }

    return NextResponse.json({ cookieHeader, cookies, user });
}
