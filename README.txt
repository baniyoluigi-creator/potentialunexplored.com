WHAT THIS DOES
--------------
Restructures the PUL blog page into categories matching your core focus
areas, and links the two sites together instead of duplicating content.

1. blog.html (for potentialunexplored.com repo root, replaces existing file)
   - Category filter row at top: Leadership | Boys to Men | Team Building
     (coming soon) | Sales & Customer Service (coming soon) | Life Readiness
     (coming soon)
   - "Leadership" section: your existing Heal to Lead entry, unchanged.
   - "Boys to Men Mentorship Camp" section: all 25 parent-question posts
     shown as teaser cards (title + short description). Each card links
     OUT to the real, already-published post on boystomencamp.com/blog/,
     opening in a new tab. Nothing is duplicated, so there's no duplicate
     content issue and each post keeps ranking on its original domain.
   - A "Browse all Boys to Men articles" button at the bottom of that
     section, linking to boystomencamp.com/blog/.

2. btm-blog-index/index.html (for boystomencamp.com repo, replaces
   /blog/index.html)
   - Same Journal page as before, with one addition: a closing banner
     inviting readers to browse the Potential Unexplored Ltd blog for
     Leadership, Team Building, and Life Readiness content, linking to
     potentialunexplored.com/blog.html in a new tab.

HOW TO UPLOAD
-------------
potentialunexplored.com repo: replace the root blog.html with the one in
this folder.

boystomencamp.com repo: replace /blog/index.html with the
btm-blog-index/index.html file in this folder.

Both are drop-in replacements, no other files need to change, no downtime.

AS TEAM BUILDING / SALES / LIFE READINESS CONTENT IS WRITTEN LATER, the
same "coming soon" category slots in blog.html are ready, just add a new
<section id="team-building">...</section> the same way the Leadership and
Boys to Men sections are built, and turn its pill in the category row into
a working #team-building link.
