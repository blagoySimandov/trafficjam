# [Map Editor](https://linear.app/traffic-jam/issue/TRA-27/investigation-investigate-how-we-can-edit-maps-and-pass-them-back-as)

# Frame the Problem

We are building a traffic simulation service and for that we would need to edit the map to
simulate different scenarios.

---

### What outcome are we looking for?

Minimally: An editable map that can be passed back to the server.
Ideally: A way to edit the map and be really pleasing to look at while doing so.

## Propose solutions

1. Rapidv2.5
   Rapid v2.5 is the current OSM editor.
   It is built by facebook and is open source.
   The editor is power and fast.
   The only problem that I have encountered while using it is that it is not exactly pretty to look at.
   The map is a 2d top down view and when you add links the tiles do not change at all.
   You just add the link though the forest/park and the background tiles do not update in any way.
   So although the user can clearly see the link, the tiles haven't changed...

   From a usability perspective, this shouldn't be a big prbolem, but it does look a bit weird.
   We can use a variation of the Rapid editor, fork it and try to add some features to make it look nicer.

   Here are screenshots:

![basic map view map](view.png "basic map view")

![after edit](editting.png "after edit map view")

In the second screenshot you can see that the tiles haven't updated and it looks a bit weird...

Some ideas:

1.  Newly added links should be highlighted. (The user should be able clearly differentiate between links he added)
    and once that are currently there). This is an option of Rapid so we just need to enable it.
2.  We should by default disable a lot of the icons and shapes, the map is too overwhelming at first sight.

3.  Optional: We can think of a way to make the background tiles update when the user adds, removes or modifies links. One way to implement this would be to ditch the background tiles fully and instead always have some kind of generated background from the osm data that adapts to our changes.

4.  DIY Editor

Start from scratch and build a custom editor.
I do not recommend this this, but it is an option.

### Recommendation

Rapid v2.5 is a good start that we can build on.

Since it is entirely written in typescript and is open source it shouldn't be that hard
to fork and improve.

In any case it will give us a good base
