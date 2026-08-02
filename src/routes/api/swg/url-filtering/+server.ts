import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/db';
import { logger } from '$lib/server/logger';
import type { RequestHandler } from './$types';

// GET /api/swg/url-filtering - Get blocked URLs and categories
export const GET: RequestHandler = async ({ url }) => {
  try {
    const group = url.searchParams.get('group') || 'dg-blocked-urls';
    const search = url.searchParams.get('search') || '';

    const blockedUrls = await prisma.sWGBlockedUrl.findMany({
      where: {
        group,
        url: {
          contains: search
        }
      },
      orderBy: { addedAt: 'desc' }
    });

    const categories = await prisma.sWGCategory.findMany({
      orderBy: { name: 'asc' }
    });

    return json({
      blockedUrls: blockedUrls.map(u => u.url),
      categories: categories.map(c => ({
        id: c.id,
        name: c.name,
        status: c.status,
        count: c.count
      }))
    });
  } catch (error) {
    logger.error('Failed to fetch URL filtering', error);
    return json({ error: 'Failed to fetch URL filtering' }, { status: 500 });
  }
};

// POST /api/swg/url-filtering - Add blocked URL
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const { url, group = 'dg-blocked-urls', addedBy = 'system' } = data;

    if (!url) {
      return json({ error: 'URL is required' }, { status: 400 });
    }

    const blockedUrl = await prisma.sWGBlockedUrl.create({
      data: {
        url,
        group,
        addedBy
      }
    });

    return json({ success: true, blockedUrl });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return json({ error: 'URL already exists in this group' }, { status: 409 });
    }
    logger.error('Failed to add blocked URL', error);
    return json({ error: 'Failed to add blocked URL' }, { status: 500 });
  }
};

// DELETE /api/swg/url-filtering - Remove blocked URL
export const DELETE: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const { url, group = 'dg-blocked-urls' } = data;

    if (!url) {
      return json({ error: 'URL is required' }, { status: 400 });
    }

    await prisma.sWGBlockedUrl.delete({
      where: {
        url_group: {
          url,
          group
        }
      }
    });

    return json({ success: true });
  } catch (error) {
    logger.error('Failed to remove blocked URL', error);
    return json({ error: 'Failed to remove blocked URL' }, { status: 500 });
  }
};

// PATCH /api/swg/url-filtering - Update blocked URL
export const PATCH: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const { oldUrl, newUrl, group = 'dg-blocked-urls' } = data;

    if (!oldUrl || !newUrl) {
      return json({ error: 'Both oldUrl and newUrl are required' }, { status: 400 });
    }

    // Delete old and create new (since url is part of unique key)
    await prisma.$transaction([
      prisma.sWGBlockedUrl.delete({
        where: {
          url_group: {
            url: oldUrl,
            group
          }
        }
      }),
      prisma.sWGBlockedUrl.create({
        data: {
          url: newUrl,
          group,
          addedBy: 'system'
        }
      })
    ]);

    return json({ success: true });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return json({ error: 'New URL already exists' }, { status: 409 });
    }
    logger.error('Failed to update blocked URL', error);
    return json({ error: 'Failed to update blocked URL' }, { status: 500 });
  }
};
