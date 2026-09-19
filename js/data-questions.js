(function (global) {
  var QUESTIONS = [
    {
      id: 1,
      prompt: `Fill in the blank: "_____ Seraphim Rose"`,
      choices: [
        { id: "1A", label: "Father", points: { OCA: 2, Antiochian: 1, GOA: 1 } },
        { id: "1B", label: "Saint", points: { ROCOR: 2, HOCNA: 2 } }
      ]
    },
    {
      id: 2,
      prompt: "Who is your preferred influencer priest?",
      choices: [
        { id: "2A", label: "Fr. Alexander Schmemann", points: { OCA: 4 } },
        { id: "2B", label: "Fr. Stephen De Young", points: { OCA: 2, Antiochian: 1 } },
        { id: "2C", label: "Fr. Josiah Trenham", points: { ROCOR: 1, HOCNA: 1, Antiochian: 1 } },
        { id: "2D", label: "Fr. Moses McPherson", points: { ROCOR: 4 } },
        { id: "2E", label: "I don't really follow priests online, I just go to liturgy", points: {} }
      ]
    },
    {
      id: 3,
      prompt: "True or False: Soup is effeminate.",
      choices: [
        { id: "3T", label: "True", points: { ROCOR: 1, HOCNA: 1 } },
        { id: "3F", label: "False", points: {} }
      ]
    },
    {
      id: 4,
      prompt: "Imagine you have a wife. Does she wear pants?",
      choices: [
        { id: "4A", label: "No", points: { ROCOR: 3, HOCNA: 3 } },
        { id: "4B1", label: "Yes, to church too", points: {} },
        { id: "4B2", label: "Yes, but not around the house", points: { ROCOR: 2, HOCNA: 1, Antiochian: 1 } }
      ]
    },
    {
      id: 5,
      prompt: "Your cathedral was built...",
      choices: [
        { id: "5A", label: "By immigrants, brick by brick, in the 1920s", points: { OCA: 1 } },
        { id: "5B", label: "With a $40M capital campaign and a gala", points: { GOA: 4 } },
        { id: "5C", label: `It's a converted Baptist church we still call "the building"`, points: { HOCNA: 2 } },
        { id: "5D", label: "It's a monastery, and also possibly the site of a genuine miracle", points: { Jerusalem: 4 } }
      ]
    },
    {
      id: 6,
      prompt: "What's on your jurisdiction's homepage?",
      choices: [
        { id: "6A", label: `A slick video and a "Give" button`, points: { GOA: 2, Antiochian: 1 } },
        { id: "6B", label: "The whole site is in Church Slavonic and you can't find the service times", points: { ROCOR: 2 } },
        { id: "6C", label: "Hasn't been updated since 2009", points: { HOCNA: 2, ROCOR: 1 } },
        { id: "6D", label: "One photo of an ancient monastery, no text", points: { Jerusalem: 2 } }
      ]
    },
    {
      id: 7,
      prompt: "Someone asks what jurisdiction you're in. Your instinct is to...",
      choices: [
        { id: "7A", label: "Explain the whole thing, unprompted", points: { Antiochian: 4 } },
        { id: "7B", label: `Just say "Orthodox" and hope they don't ask more`, points: { OCA: 4 } },
        { id: "7C", label: "Correct their canonical terminology", points: { ROCOR: 2, HOCNA: 1 } },
        { id: "7D", label: "Mention the metropolitan by name like a personal friend", points: { GOA: 4 } }
      ]
    },
    {
      id: 8,
      prompt: "Your parish council meeting is conducted mostly in...",
      choices: [
        { id: "8A", label: "English, with Robert's Rules", points: {} },
        { id: "8B", label: "English, but it always finds a way to become a referendum on which calendar we're using", points: { ROCOR: 2, OCA: 1 } },
        { id: "8C", label: "English, and every disagreement is quietly resolved before the meeting even starts", points: { GOA: 2 } },
        { id: "8D", label: "There is no parish council, there's just Father", points: { HOCNA: 2, Jerusalem: 1 } }
      ]
    },
    {
      id: 9,
      prompt: "What's the vibe of your jurisdiction's patron-saint feast day?",
      choices: [
        { id: "9A", label: "Potluck, folding tables, someone's grandmother is in charge", points: { OCA: 1 } },
        { id: "9B", label: "A small group of very serious people who show up an hour early to make sure everything's done right", points: { ROCOR: 4 } },
        { id: "9C", label: "A small group of very serious people, and you're not entirely sure who's still in communion with whom", points: { HOCNA: 4 } },
        { id: "9D", label: "Catered, photographed, on the diocesan Instagram", points: { GOA: 4 } },
        { id: "9E", label: "Nobody outside the monastery knows it happened", points: { Jerusalem: 2 } }
      ]
    },
    {
      id: 10,
      prompt: "Coffee hour is...",
      choices: [
        { id: "10A", label: "A folding table with a Dunkin' Donuts box", points: { OCA: 1 } },
        { id: "10B", label: "There isn't one, everyone just leaves", points: { HOCNA: 2, Jerusalem: 2 } },
        { id: "10C", label: "A theological debate that started over pastries and hasn't ended", points: { OCA: 2, Antiochian: 2 } },
        { id: "10D", label: "A full spread, an unspoken seating chart, and a very clear sense of whose family paid for the icon screen", points: { GOA: 4 } }
      ]
    },
    {
      id: 11,
      prompt: "The New Calendar vs. Old Calendar debate makes you feel...",
      choices: [
        { id: "11A", label: `"There's a debate?"`, points: {} },
        { id: "11B", label: "Mildly smug that you already know the answer", points: { OCA: 2 } },
        { id: "11C", label: "Ready to produce a 20-minute explanation unprompted", points: { ROCOR: 2, Antiochian: 1 } },
        { id: "11D", label: "This is the actual reason you left your last jurisdiction", points: { HOCNA: 4 } }
      ]
    },
    {
      id: 12,
      prompt: "Your bishop's most recent public statement was about...",
      choices: [
        { id: "12A", label: "Nothing, you don't think he's issued one this year", points: { Jerusalem: 2 } },
        { id: "12B", label: "A capital campaign or a new cathedral project", points: { GOA: 4 } },
        { id: "12C", label: "A canonical dispute with another jurisdiction", points: { HOCNA: 2, ROCOR: 1 } },
        { id: "12D", label: "You genuinely don't know his name off the top of your head", points: { HOCNA: 1 } }
      ]
    },
    {
      id: 13,
      prompt: "The craziest rumor circulating at your parish is...",
      choices: [
        { id: "13A", label: "Someone in the parish comment-debates atheists on YouTube under a pseudonym everyone's already figured out", points: { Antiochian: 2 } },
        { id: "13B", label: "The building fund money went somewhere it shouldn't have", points: { GOA: 4 } },
        { id: "13C", label: "Father is secretly in communication with some other synod entirely", points: { HOCNA: 2, ROCOR: 2 } },
        { id: "13D", label: "Nobody's sure if the monastery down the road is still in communion with anyone, including itself", points: { ROCOR: 2 } },
        { id: "13E", label: "Someone flew to Jerusalem just for the Holy Fire, and it's come up at every coffee hour since", points: { Jerusalem: 4 } }
      ]
    },
    {
      id: 14,
      prompt: "When other Orthodox want to mud-sling, they call you...",
      choices: [
        { id: "14A", label: "Fordhamite", points: { GOA: 0.5, OCA: 0.5, Antiochian: 0.5 } },
        { id: "14B", label: "SCOBAdox", points: { GOA: 2, Antiochian: 1, OCA: 1 } },
        { id: "14C", label: "Non-canonical", points: { HOCNA: 4 } },
        { id: "14D", label: "Phyletist", points: { GOA: 1 } }
      ]
    },
    {
      id: 15,
      prompt: "Your uncle says something wrong about the Trinity at Thanksgiving. What happens next?",
      choices: [
        { id: "15A", label: "Someone quietly corrects him under their breath, never mentioned again", points: { OCA: 4 } },
        { id: "15B", label: "The whole table erupts, three people are shouting different patristic quotes", points: { ROCOR: 4 } },
        { id: "15C", label: "You write your priest a four-paragraph text about it later", points: { Antiochian: 2, OCA: 1 } },
        { id: "15D", label: "Nobody notices, nobody was really listening", points: {} }
      ]
    },
    {
      id: 16,
      prompt: "How do you fast during Great Lent?",
      choices: [
        { id: "16A", label: "What's Great Lent?", points: { GOA: 1, Antiochian: 1 } },
        { id: "16B", label: "Strictly — vegan, no oil on weekdays — and you don't make a big deal about it", points: { OCA: 2 } },
        { id: "16C", label: "Strictly, and everyone in a 10-foot radius knows about it", points: { ROCOR: 2, HOCNA: 1, Antiochian: 1 } },
        { id: "16D", label: "You fast from something modern instead — screens, complaining", points: { GOA: 0.5, Antiochian: 0.5, OCA: 0.5 } },
        { id: "16E", label: "Not as well as I should", points: { GOA: 0.5, Antiochian: 0.5, OCA: 0.5 } }
      ]
    },
    {
      id: 17,
      prompt: "What does the chanting sound like at your parish?",
      choices: [
        { id: "17A", label: "Byzantine — monophonic, modal, someone holding the drone", points: { GOA: 2, Antiochian: 2 } },
        { id: "17B", label: "Four-part harmony, sounds like a hymnal choir concert", points: { OCA: 4 } },
        { id: "17C", label: "Hymns from a hymnal, four-part, and vaguely Anglican", points: { Antiochian: 2 } },
        { id: "17D", label: "Znamenny chant — monastic, ancient, austere", points: { ROCOR: 2, HOCNA: 1 } }
      ]
    },
    {
      id: 18,
      prompt: "The children in our parish...",
      choices: [
        { id: "18A", label: "Already have strong opinions about wedding dance formations", points: { GOA: 2 } },
        { id: "18B", label: "Vanish for six weeks every summer to a camp in the mountains all their friends also go to", points: { Antiochian: 4 } },
        { id: "18C", label: "Are homeschooled, partly to keep the culture war out of the curriculum", points: { ROCOR: 2 } },
        { id: "18D", label: "There are no children", points: { Jerusalem: 2 } }
      ]
    },
    {
      id: 19,
      prompt: "Something distinctive about your parish:",
      choices: [
        { id: "19A", label: "Half the congregation crosses themselves backwards out of habit and is already organizing a bus for March for Life, and the other half can't figure out why there are pews", points: { Antiochian: 4 } },
        { id: "19B", label: "There's a low-grade, recurring argument about how strong the coffee should be, and it predates everyone currently in the parish", points: { Antiochian: 2 } },
        { id: "19C", label: "At least three converts here used to be youth pastors", points: { Antiochian: 2 } },
        { id: "19D", label: "Explaining what's different about the Sunday service gets you a look like you've said something in another language", points: {} }
      ]
    }
  ];

  var api = { QUESTIONS: QUESTIONS };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    global.QuizData = Object.assign(global.QuizData || {}, api);
  }
})(typeof window !== "undefined" ? window : globalThis);
