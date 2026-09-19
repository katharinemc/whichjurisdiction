(function (global) {
  var JURISDICTIONS = {
    GOA: {
      key: "GOA",
      name: "Greek Orthodox Archdiocese of America",
      hasPage: true,
      slug: "goa",
      writeup: [
        `You were right about most things before you turned thirty, and you've never seen a reason to revisit that. You like beautiful things and you don't apologize for it. If you aren't already a mover and a shaker in town, you're on your way up, and you have the committee appointment and social calendar to prove it. You think competence is a form of respect, and you notice when other people don't have it.`,
        `You're not devout in the fasting-and-weeping sense — you're devout the way old money is Episcopalian, completely, and without needing to discuss it. The parish runs in your family — Orthodoxy is just what your family <em>does.</em> (And if you're actually a convert — you're a natural institutionalist. You didn't join a faith so much as recognize an organization that already runs the way you think organizations should run. And you really care about governance.)`,
        `GOA fits you because it doesn't ask you to perform faith, it assumes you already have it, the same way it assumes the dome will get built and the capital campaign will hit its number. The building is beautiful, the chanter has been feuding with the choir director since the Clinton administration, and you will absolutely have an opinion about whether the new priest's homilies are too long.`
      ]
    },
    Antiochian: {
      key: "Antiochian",
      name: "Antiochian Orthodox Christian Archdiocese",
      hasPage: true,
      slug: "antiochian",
      writeup: [
        `You found this by accident, on purpose. Somewhere in your twenties there was a reading list — Lewis, then the Fathers, then a podcast, then it was too late — and you consumed an entire tradition in eighteen months the way other people binge a show. You don't do anything halfway. You're the type to memorize the seven ecumenical councils before you've even been chrismated, and you genuinely enjoy being the person at the table who actually knows the history. You weren't looking for beauty. You were looking for the correct answer, and once you found it, you needed everyone else to see it too.`,
        `You're not devout the quiet way — you're devout the way a debate champion is devout, unable to let a claim sit unexamined, especially your own. Somewhere back there you left a nondenominational church, or a Baptist one, or possibly a pulpit, and you brought the argumentative instincts with you; you just pointed them at Rome and Geneva instead. (If you're an Arab cradle reading this — you already know. Keep teaching them to dabke for the festival; someone has to.)`,
        `Antiochian fits you because it's the jurisdiction built by people who argued their way in — ex-youth-pastors, Western Rite refugees, podcast apologists — and it makes room for the argument to keep going. There's always a text thread mid-debate, always someone who left over something specific and will tell you exactly what, and always, somewhere, an Arabic coffee that no convert manages to drink correctly on the first try.`
      ]
    },
    OCA: {
      key: "OCA",
      name: "Orthodox Church in America",
      hasPage: true,
      slug: "oca",
      writeup: [
        `You are quietly, thoroughly right about things, and you've never once needed anyone else to confirm it. You find people who perform their faith a little exhausting — not because they're wrong, but because the performance is the tell that they're still working something out, and you finished working it out a while ago. You'd rather read Schmemann alone on a Tuesday than discuss Schmemann at coffee hour. You're obedient to your spiritual father, but no one else needs to know you have a spiritual father. You correct people once, quietly, and let it go; you don't need witnesses to be right.`,
        `Here's the thing about you, though — I genuinely cannot tell if you're a convert or a cradle, and neither can your own parish. Nobody's ever made you explain your path in, you've never asked anyone else to explain theirs, and your last name isn't giving anything away. That's not an accident of your particular parish. It's the whole design: American as apple pie, no ethnic flex required, no interesting backstory necessary. You could've shown up last Tuesday or been baptized as an infant in 1974, it wouldn't change a single thing about how you act at coffee hour.`,
        `OCA fits you because it was built by people trying to invent an Orthodoxy with no adjective in front of it, and at your parish, they basically pulled it off. Coffee hour runs on Dunkin Donuts and a grandmother who's been doing it since 1987, and if you ask what jurisdiction someone is, they just say "Orthodox" — like you asked something slightly odd.`
      ]
    },
    ROCOR: {
      key: "ROCOR",
      name: "Russian Orthodox Church Outside Russia",
      hasPage: true,
      slug: "rocor",
      writeup: [
        `You think most other Orthodox Christians are doing it wrong, and you're not especially good at pretending otherwise. You corrected someone's fasting rule at a potluck once and you'd do it again. You didn't leave your last jurisdiction so much as escort yourself out of it, on your way to something more serious.`,
        `You call this rigor. Other people call it being a little too enthusiastic about the Tsar, for someone born in New Jersey. Your priest deadlifts in his cassock and posts the video, and you consider this a leadership quality.`,
        `You didn't convert to Orthodoxy so much as convert to the version of Orthodoxy with the clearest chain of command.`,
        `And yet — underneath the posting, you actually keep the fasts. All of them, the hard way, without the modern workarounds, and you've been doing it long enough that it's not a discipline anymore, it's just Tuesday. Whatever you do with your prayer rule stays between you and God, which, given everything else, might be the most surprising thing about you. Say what you want about the rest of it — you're not performing this part.`,
        `ROCOR fits you because it was built by people who left rather than compromise, and it still runs on that same refusal — old calendar, long services, zero patience for anyone who thinks "keeping it simple" is a virtue. Somewhere in your parish there's Znamenny chant nobody outside can follow, a homeschool co-op that meets more than the local public school, and a table that will genuinely erupt over a calendar question you brought up on purpose.`
      ]
    },
    Jerusalem: {
      key: "Jerusalem",
      name: "Jerusalem Patriarchate",
      hasPage: false,
      slug: null,
      writeup: [
        `Okay. First, how. There are maybe a dozen Jerusalem Patriarchate parishes in the entire United States, and by some genuine coincidence of geography, boredom, or fate, you found one — or more likely, one found you, because nobody stumbles into this jurisdiction.`,
        `That tracks, because you're the type this happens to. You're not a joiner in the ordinary sense — you don't collect affiliations, you don't need a large room to feel like you belong in it, and you've never once needed your commitments validated by other people making the same ones. You like things that are old less for the aesthetic and more for the fact of it — you'd rather stand in a place where something actually happened than a place that's merely beautiful. You've flown somewhere once for a single specific religious reason and you didn't feel the need to explain the trip to anyone.`,
        `Which is the whole shape of this jurisdiction: all ancient-lineage confidence, no institutional muscle to back it up, and somehow that's the appeal rather than the drawback. Your parish is real, your bishop is real, nobody at coffee hour is pretending otherwise — there just aren't enough of you for anyone outside to have noticed you exist, and you've made a kind of peace with that. You mention Holy Fire at every coffee hour, not because you're trying to impress anyone, but because there's genuinely no one else in your life who understands why it matters, and you have to tell someone.`
      ]
    },
    HOCNA: {
      key: "HOCNA",
      name: "HOCNA",
      hasPage: false,
      slug: null,
      writeup: [
        `Okay, first: are you doing alright? Genuinely asking. This result was built as a throwaway — nobody was supposed to land here by accident, and the scoring made sure of it. You didn't stumble in here. Landing on HOCNA requires making some pretty specific choices. I have some follow-up questions I'd like to ask you gently, over coffee, somewhere with good lighting.`,
        `Here's what I can tell about you: You've left at least one jurisdiction, possibly several, each time it was because everyone else had gone soft, which is a sentence you've said out loud more than once. You're not entirely sure who's currently in communion with whom, and you've made peace with that being a moving target rather than a settled fact. There's no council at your parish, just Father, which you have decided is a feature rather than a structural risk. Your website hasn't been updated since 2009 and updating it now would feel, to you, like admitting defeat.`,
        `You didn't convert to Orthodoxy so much as convert away from every other version of it, sequentially, in order, until there was nowhere left to go but here.`,
        `HOCNA fits you because it's the last stop — the jurisdiction for people who ran out of jurisdictions to be disappointed in. I'm not going to pretend I fully understand how you got here. But if you ever want to talk about it, I'm around. I also think you should meet more people.`
      ]
    }
  };

  var api = { JURISDICTIONS: JURISDICTIONS };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    global.JurisdictionData = Object.assign(global.JurisdictionData || {}, api);
  }
})(typeof window !== "undefined" ? window : globalThis);
