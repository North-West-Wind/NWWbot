var RedditAPI = require("reddit-wrapper-v2");
const Discord = require("discord.js");
var color = Math.floor(Math.random() * 16777214) + 1;
const { validImgurURL, validRedditURL, decodeHtmlEntity, validGfyURL, validImgurVideoURL, validRedditVideoURL, validNotImgurURL, validRedGifURL } = require("../function.js");
const Gfycat = require('gfycat-sdk');
var gfycat = new Gfycat({clientId: process.env.GFYID, clientSecret: process.env.GFYSECRET});

var redditConn = new RedditAPI({
  // Options for Reddit Wrapper
  username: process.env.RUSER,
  password: process.env.RPW,
  app_id: process.env.APPID,
  api_secret: process.env.APPSECRET,
  user_agent: "Reddit-Watcher-V2",
  retry_on_wait: true,
  retry_on_server_error: 5,
  retry_delay: 1
});

module.exports = {
  name: "porn",
  description: "Returns real porn images from Reddit. Require NSFW channel.",
  usage: "[tag]",
  
  //age
    //college
  college: ["collegesluts", "CollegeAmateurs", "collegensfw", "CollegeInitiation", "springbreakers"],
    //milf
  milf: ["milf", "MilfsAndHousewives", "maturemilf", "realmilf", "ChocolateMilf", "GroupOfNudeMILFs", "HotAsianMilfs", "hairymilfs", "MILFs", "puremilf", "FrenchesMILFs", "realmoms", "HotMILFs"],
    //mature
  mature: ["courgars", "realolderwomen", "gilf", "maturewoman", "AgedBeauty", "agedlikefinewine", "GeriatricPorn"],
    //teen
  teen: ["LegalTeens", "Just18", "youngporn", "Barelylegal", "barelylegalteens", "YoungMalePorn"],
  
  //amateur
  amateur: ["RealGirls", "Amateur", "randomsexiness", "PetiteGoneWild", "homemadexxx", "AmateurArchives", "gwcumsluts", "treatemright", "Nsfw_Amateurs", "Workoutgonewild", "amateurbondage", "amateurgfs", "Bad_ass_girlfriends", "instahotties", "FuckableAmateurs", "DomesticGirls", "nudeamateurporn", "AmateurXXX", "amateurs", "sext", "realamateurpics", "realgirlsphotoalbums", "AmateurPorn", "AmateurPorn", "AmateurHotties", "Amateur_Bitches", "NSFW_GirlFriendVideos"],
    //self-shots
  selfShots: ["ChangingRooms", "NSFW_Snapchat", "NudeSelfies", "CellShots", "snapchatgw", "selfshots", "selfpix", "GirlsWithPhones", "selfshotgirls", "freshfromtheshower", "xPosing", "SelfPotraitNSFW", "snapchatboobs", "GaySnapchatImages", "Amateurselfpic", "SexSelfies", "Self_Perfection", "sexting"],
  
  //appearance
  appearance: ["Blonde", "recoilboobs", "TeaGirls", "girlswithguns", "beetris"],
    //appearance modification
  appearanceModification: ["braceface", "MakeUpFetish", "moddedgirls", "HeavyEyeliner", "PearlGirls"],
      //piercings
  piercings: ["PiercedNSFW", "piercedtits"],
      //tattoos
  tattoos: ["Hotchichswithtattoos", "hotguyswithtattoos"],
    //clothing
  clothing: ["OnOff", "GirlswithGlasses", "lingerie", "ShinyPorn", "leotards", "sexygirlsinjeans", "GirlsinLaceFishnets", "RepressedGoneWild", "MuricalNSFW", "onoffcollages", "CheekyBottoms", "boobstrap", "braandpanties", "Pajamas", "LadiesInLeather", "tshirtsandtanktops", "BlankTapeProject", "WedgieGirls", "clothedwomen", "FlannelGetsMeHot", "DressedAndUndressed", "Aprons", "ShortShorts", "ShinyFetish", "GirlsWithHeadTowels", "pasties", "LatexUnderClothes", "Bodystockings", "GirlsinTrenchcoats", "OpenShirt", "chichswearingchucks", "reversableshirtgirls", "workoutgirls", "girlsinhoodies", "fishnets", "cupless", "Chakuero", "Cinched"],
      //bodyparts through clothes
  bodypartsThroughClothes: ["WtSSTaDaMiT", "pokies", "seethru", "ThinClothing", "CamelToeGirls", "NippleRipple", "Bulges", "chilly", "WetTshirts", "nobra", "cameltoepics", "sheerpanties"],
      //bottomless
  bottomless: ["Bottomless_Vixens", "Bottomless", "nopanties", "UTSM"],
      //clothed/naked pair
  clothedNakedPair: ["cfnm", "cfnf", "cfnmfetish"],
      //dresses
  dresses: ["tightdresses", "WeddingsGoneWild", "nsfwskirts", "girlsinplaidskirts", "SkirtRiding"],
      //shoes
  shoes: ["SexyGirlsInBoots", "highheelsNSFW", "Boots", "sneakersgonewild", "heels"],
      //stockings
  stockings: ["stockings", "girlsinleggings", "thighhighs", "GarterBelts", "GirlsinTUBEsocks", "pantyhose", "GirlsInSocks", "SeeThroughLeggings", "girlsinpantyhose", "sockgirls", "kneesocks", "Pantyhosedgirls", "HotLeggings", "girlsinanklesocks", "stocking_vids", "Thapt"],
      //swimwear
  swimwear: ["bikinis", "bikinibridge", "slingbikini", "realbikinis", "skivvies", "monokini", "Bikini", "nsfwbikini"],
      //tight clothing
  tightClothing: ["girlsinyogapants", "YogaPants", "tight_shorts", "TightShorts", "sweatermear", "tightsqueeze", "cameltoe", "HungryButts", "girlsinyogashorts", "GloriaV", "AthleticWearPorn", "TightShirts", "tights", "shinypants", "malespandex"],
      //topless
  topless: ["ToplessInJeans", "Topless_Vixens", "NoTop"],
      //Underwear
  underwear: ["GirlsWearingVS", "MaleUnderWear", "bragonewild", "openbra"],
        //panties
  panties: ["Pantyfetish", "boyshorts", "panties", "undies", "GirlsinPinkUndies", "PantiesToTheSide", "boyshort", "anklepanties", "satinpanties", "cottonpanties", "GrannyPanties", "pantyslide", "Pantiesdown", "crotchlesspanties"],
        //thongs
  thongs: ["assinthong", "AssholeBehindThong", "thongs"],
      //uniforms/outfits
  uniformsOutfits: ["nsfwoutfits", "GirlsinSchoolUniforms", "MilitaryGoneWild", "NSFWCostumes", "SluttyHalloween", "sexyuniforms", "serafuku", "frenchmaid", "NSFWBarista", "meninuniform", "WomenInUniform", "WomenWearingShirts", "meido", "MilitaryMen"],
        //cosplay
  cosplay: ["nsfwcosplay", "starwarsnsfw", "cosplayonoff", "Cosporn", "CosplayBoobs", "PornParody", "SexyStarWars", "Cosplayheels"],
    //expressions
  expressions: ["HappyEmbarrassedGirls", "O_Faces", "BorednIgnored", "shewantstofuck", "omgbeckylookathiscock", "O_Face", "Annoyedtobenude", "sillygirls", "enf", "butterface", "notreallyenjoyingit", "BoredandIgnored", "BoredIgnored", "MorningGirls", "LadyBonerOrFaces"],
    //pose
  pose: ["facedownassup", "legsup", "spreadeagle", "Presenting", "NWFW_Plowcam", "Aparthigh", "handinpanties", "girlsontheirbacks", "Lordosis", "cumov", "StomachDownFeetUp", "onherstomach", "OnAllFours", "doggy", "LyingOnBellyNSFW", "DropEm", "Feetup"],
    //wet&messy
  wetNmessy: ["wet", "Oilporn", "Bathing", "GirlswithBodypaint", "Slippery", "WetAndMessy", "wetontheoutside", "underwaterbabes", "oily", "WetBabes"],
  //body parts
    //head
      //hair
  hair: ["ravenhaired"],
        //blonde
  blonde: ["Blondeass", "blondehairblueeyes", "Blondes", "onlyblondes"],
        //brunette
  brunette: ["brunette", "brunetteass"],
        //dyed
  dyed: ["GirlswithNeonHair"],
        //hairstyle
  hairstyle: ["shorthairchicks", "Curls", "pigtails", "hairbra", "NSFWBraids", "GirlswithPigtails", "Rapunzel", "girlswithbangs", "Ponytails"],
        //redhead
  redhead: ["ginger", "redheads", "FreckledRedheads", "gingerdudes", "Redheadass"],
      //lips/mouth
  lipsMouth: ["MouthWideOpen", "lipbite", "DSLs", "boltedonlips"],
    //lower body
  lowerBody: ["SexyTummies", "backdimples", "DatV"],
      //ass
  ass: ["ass", "TheUnderbun", "booty", "SpreadEm", "LoveToWatchYouLeave", "HighResASS", "twerking", "ButtsAndBareFeet", "booty_gifs", "Underbun", "AssOnTheGlass", "Tushy", "datass", "NoTorso", "BoltedOnBooty", "Top_Tier_Asses", "assgifs", "Cheeking", "datbuttfromthefront"],
        //large
  large: ["bigasses", "BubbleButts", "pawg", "juicybooty", "whooties", "hugeass"],
      //asshole
  asshole: ["asshole", "StandingAsshole", "FaceAndAsshole"],
      //feet
  feet: ["Feet_NSFW", "FootFetish", "feetish"],
      //gap
  gap: ["datgap", "happygaps", "thegap"],
      //genitalia
        //penis
  penis: ["penis", "DickSlips", "foreskin", "cock", "softies", "sizecomparison", "grower"],
          //large
  penisLarge: ["MassiveCock", "HugeDickTinyChick", "TooBig", "monster_cocks", "Bitches_Like_it_Big", "MassiveCockVids"],
          //small
  penisSmall: ["tinydick", "smalldicks"],
        //vulva
  vulva: ["pussy", "rearpussy", "simps", "vagina", "MoundofVenus", "PussyMound", "TheRearPussy", "PerfectPussies", "vulva", "openholes", "spreading", "Pink", "bigclit", "PinkandBare", "pelfie", "closeup", "shavedpussies", "shavedgirls"],
          //hair
  vulvaHair: ["HairyPussy", "FireCrotch", "peachfuzz", "TheLandingStrip", "Trim", "Naturalgirls", "thefullbush", "HairyAssGirls", "Hairy", "inthebushes", "FuzzyPeeks", "DyedPubes", "hairychicks"],
          //labia
  vulvaLabia: ["LipsThatGrip", "beef_flaps", "datgrip", "ButterflyWings", "peachlips", "BeefFlaps", "puffypussy"],
      //hips
  hips: ["theratio", "hipcleavage", "Hips", "HipBones"],
      //legs
  legs: ["legs", "ThichThighs", "PerfectThighs", "Thighs"],
    //upper body
  upperBody: ["chesthairporn", "HairyArmpits", "underarms"],
      //breasts
  breasts: ["Boobies", "TittyDrop", "boobounce", "boobs", "homegrowntits", "youtubetitties", "BreastEnvy", "boobgifs", "naturaltitties", "tits", "handbra", "Saggy", "Bigtitssmalltits", "torpedotits", "hersheyskisstits", "PM_ME_YOURR_TITS_GIRL", "feelthemup", "SloMoBoobs", "PerfectTits", "bananatits", "Titsgalore", "breastplay", "Perky", "titsagainstglass", "breasts", "Rush_Boobs", "knockers", "boobkarma", "boobland", "hanging", "titties_n_kitties"],
        //from an angle
  fromAnAngle: ["cleavage", "TheUnderboob", "TheHangingBoobs", "JustOneBoob", "sideboob", "EpicCleavage", "underboob", "OneInOneOut"],
        //implants
  implants: ["boltedontits", "HardBoltOns", "BeforeAndAfterBoltons", "BoltedOnMaxed"],
        //large
  breastLarge: ["BustyPetite", "burstingout", "hugeboobs", "Stacked", "bustybabes", "Hugeboobshardcore", "hugenaturals", "bigboobs", "EngorgedVeinyBreasts", "Bustier", "ThinChickWithTits", "hugeboobvideos", "Busty", "heavyhangers", "Bustyfit", "HugeTitsSoftcore", "Busty_gifs", "veins", "SlutBusty", "hugeracks", "BigBoobies", "BustyBabesGalore"],
        //nipples
  nipples: ["Nipples", "nipslip", "Puffies", "areolas", "SmallNipples", "bigareolas"],
        //small
  breastSmall: ["dirtysmall", "TinyTits", "aa_cups", "B_Cups", "aa_cupxxx"],
  //body traits
    //complexion
      //freckles
  freckles: ["SexyFrex", "girlswithfreckles", "FreckledCumsluts"],
      //light skin
  lightSkin: ["palegirls", "paleskin"],
      //tan
  tan: ["tanlines"],
    //traits
  traits: ["hotamputees"],
      //flexible
  flexible: ["flexi"],
      //pregnant
  pregnant: ["PreggoPorn", "preggo", "pregporn"],
    //types
      //bbw
  bbw: ["BBW", "plumper", "bbwbikinis", "BBWVideos", "ssbbw", "Plumpers", "SSBBW_LOVE"],
      //chubby
  chubby: ["thick", "chubby", "ThichChixxx", "PerkyChubby", "HairyCurvy"],
      //curvy
  curvy: ["curvy", "voluptuous", "CurvyPlus"],
      //Petite
  petite: ["funsized", "petite", "PetiteGirls"],
      //Skinny/Thin
  skinnyThin: ["thinspo", "xsmallgirls", "skinnytail", "slimgirls", "Waif", "Ribcage"],
  //Classic/Vintage
  classicVintage: ["OldSchoolCoolNSFW", "VintageBabes", "gonewanton", "OlderPorn", "VintageSmut", "VintageCelebsNSFW", "ClassicXXX", "VictorianSluts", "ClassicPornMags", "VintageAmateurs", "VintageErotica"],
  //cum play
    //cum
  cum: ["cumsluts", "cumfetish", "cumcoveredfucking", "amateurcumsluts", "before_after_cumsluts", "throatpies", "cumonclothes", "CumSwap", "OhCumOn", "CumAgain", "cumplay_gifs", "RedditorCum", "CumOnGlasses", "IsThatCUM", "teensexcum", "FakeCum", "girlslickingcum", "prematurecumshots", "World_of_cum", "ManMilk"],
      //creampie
  creampie: ["creampies", "creampie", "creampiegifs", "Breeding", "felching", "CumFarting"],
      //cum-shot
  cumShot: ["GirlsFinishingTheJob", "thickloads", "CumHaters", "bodyshots", "cumshots", "coveredincum", "cumshotgifs", "CumInTheAir", "femalecompletion", "cumshot", "SuckingItDry", "pulsatingcumshots", "Spermjoy", "Cumonboobs", "cumvids", "cumbtwntits", "cumtrays", "buttloads"],
        //bukkake
  bukkake: ["Bukkake", "TrueBukkake"],
        //facial
  facial: ["FacialFun", "Facials", "after_the_shot", "facialcumshots", "CumshotSelfies", "EthnicFirlFacials", "facial", "nosecum", "OnOn", "BlackGirlsLoveFacials"],
      //swallowing
  swallowing: ["OralCreampie", "CumSwallowing"],
    //female
  female: ["grool", "squirting", "GushingGirls", "wetspot"],
  //ethnicity
  ethnicity: ["latinas", "DarkAngels", "WomenOfColour", "SweNsfw", "LatinasGW", "CaribbeanGirls", "MiddleEasternHotties", "womenofcolorgifs", "oliveskin", "BrownBubbas", "Mexicana", "latinascaliente", "JewishBabes", "latinaporn", "Hotlatinas", "polishnsfw"],
    //asian
  asian: ["AsianHotties", "juicyasians", "AsianNSFW", "AsianPorn", "NSFW_Korea", "AsianHottiesGIFS", "bustyasians", "NSFW_China", "sea_girls", "AsianCumsluts", "JapaneseHotties", "Oriental", "AsianPussy", "asianbabes", "AsianAss", "ThichAsians", "TinyAsianTits", "AmateurAsianGirls", "AsianAsshole", "asian_gifs", "AsianBlowjobs", "KoreanHotties", "AsianOL", "AsianNipples", "AsianAmericanHotties", "AsianChicks", "Asian_Fever", "SexDolls"],
    //black
  black: ["WomenOfColor", "Ebony", "womenofcolorXXX", "nsfwblackpeoplegifs", "Ebonyasshole", "black_porn", "BlackGirlPics"],
    //euro
  euro: ["EuroGirls", "easterneuropeangirls", "Scandinaviangirls", "NordicWomen"],
    //indian
  indian: ["IndianBabes", "IndianFetish", "IndianTeens", "indian", "DestiBoners"],
    //japanese
  japanese: ["NSFW_Japan", "Gravure", "Softcorejapan", "JapanesePornIdols", "JapanesePorn", "javure"],
  //exhibition
  exhibition: ["inflagranti", "CaughtFucking"],
    //gonewild
  gonewild: ["gonewild", "gonewildcurvy", "asstastic", "AsiansGoneWild", "GWCouples", "GoneWildPlus", "GoneWildTube", "ladybonersgw", "treesgonewild", "workgonewild", "GWNerdy", "BigBoobsGW", "GoneMild", "altgonewild", "gifsgonewild", "gonewildcolor", "BDSMGW", "AnalGW", "dykesgonewild", "gonewildcouples", "GoneWildSmiles", "UnderwearGW", "GaybrosGoneWild", "TributeMe", "LabiaGW", "gonewildflicks", "BigBoobsGonewild", "GoneInsane", "TallGoneWild", "gwpublic", "BBWGW", "gaymersgonewild", "leggingsgonewild", "GoneWildHairy", "ArtGW", "mangonewild", "IndiansGoneWild", "GoneWildCD", "GoneWildTrans", "mycleavage", "daresgonewild", "peegonewild", "RateMyNudeBody", "femalesgonewild", "Swingersgw", "LGBTGoneWild", "TeaseMePleaseMe", "gwchallenge", "GoneWildScrubs", "TILgonewild", "couplesgonewild", "bigonewild", "GWbanned", "CurvyGonewild", "GoneWildNerdy", "curvesarebeautiful", "GonewildFaces", "LadiesGoneWild", "gonewildvideos", "BHMGoneWild", "gwbooks", "Gonewild_GIFS", "kinsters_gone_wild", "ForeignObjectsGW", "MasturbationGoneWild", "LingerieGW", "ShowerBeerGoneWild", "gonewildmetal", "GONEWILDTWERK", "socksgonewild", "GoneErotic", "frontgonewild", "GWCouples4Ladies", "DirtyPantiesGW", "Thatrearview", "naughtyatwork", "deCrypto", "BigBoobOnTopGW", "mengonewild", "goneclothed", "GirlsGoneDogeCoin", "DesiGoneWild", "MotorcyclesGoneWild", "AmeristraliaGW", "guysgonewild", "ketogonewild", "KeepitClassy", "malesgonewild", "Victory_Girls", "MatureGW", "milfgw", "EdmontonGoneWild", "fmgonewild", "No_Pants_Party"],
    //public
  public: ["Unashamed", "PublicFlashing", "FlashingGirls", "SexInFrontOfOthers", "RealPublicNudity", "Mooning", "exposedinpublic", "girlsdoingstuffnaked", "girlsflashing", "PussyFlashing", "PublicBoys", "public", "BonersInPublic", "Gloryholes", "hottestvoyeurs", "gaycruising", "UnashamedGuys", "publicvideos"],
  //fetish
  fetish: ["distension", "kinky", "lactation", "joi", "fetish", "Hucow", "pegging_unkinked", "Subwife", "Pushing", "JerkingInstruction", "HypnoGoneWild", "KINK", "fuckingmachines", "cummingonfigurines", "slutwives", "JerkingEncouragement", "girlscontrolled", "Stuffers", "ttotm", "Vore", "tickling", "Sexmachines", "freeuse", "squidsgonewild", "cheatingwives"],
    //bdsm
  bdsm: ["bdsm", "SheLikesItRough", "Spanking", "BDSMerotica", "BDSMvideo", "BDSM_NoSpam", "NSFW_BDSM", "lesBDSM", "kinkyporn"],
        //bondage
  bondage: ["Bondage", "collared", "forcedorgasms", "damselsindistress", "shinybondage", "Cuffed", "gagged", "kinbaku", "lockedup", "boundgirls"],
        //domination & submission
  dominationSubmission: ["facesitting", "lesdom", "AbusePorn2", "sissyhypno", "cuckquean", "submissive", "Humiliation", "choking", "maledom", "Sissy_humiliation", "keyholdercaptions", "lezdom", "Dominated", "femsub"],
          //femdom
  femdom: ["Cuckold", "Pegging", "Femdom", "RuinedOrgasms", "Sissies", "FemdomHumiliation", "CuckoldPregancy", "chasity", "WomenLookingDown", "girlswearingstrapons", "MasturbatorsAnonymous", "chastitytraining"],
    //drugs
  drugs: ["DrunkGirls", "Smokin"],
    //role enactment
  roleEnactment: ["littlespace"],
      //age play
  agePlay: ["AgePlaying", "ABDL"],
      //furry
  furry: ["cat_girls", "fursuitsex", "sexybunnies", "furryfemdom"],
      //pet play
  petPlay: ["petplay"],
      //rape/abuse
  rapeAbuse: ["StruggleFucking", "rape_roleplay", "StrugglePorn"],
    //watersports
  watersports: ["Pee", "watersports", "cuckoldcaptions", "wetfetish", "GayWatersports", "girlspooping", "AsianPee"],
  //general categories
  generalCategories: ["nsfw", "nsfwhardcore", "nsfw2", "HighResNSFW", "BonerMaterial", "porn", "iWantToFuckHer", "NSFW_nospam", "Sexy", "nude", "UnrealGirls", "primes", "THEGOLDSTANDARD", "nsfw_hd", "UHDnsfw", "BeautifulTitsAndAss", "FuckMarryOrKill", "NSFWCute", "badassgirls", "HotGirls", "PornPleasure", "nsfwnonporn", "NSFWcringe", "NSFW_PORN_ONLY", "Sex_Games", "BareGirls", "lusciousladies", "Babes", "FilthyGirls", "NaturalWomen", "ImgurNSFW", "Adultpics", "sexynsfw", "nsfw_sets", "OnlyGoodPorn", "TumblrArchives", "HarcoreSex", "PornLovers", "NSFWgaming", "Fapucational", "RealBeauties", "fappitt", "exotic_oasis", "TIFT", "nakedbabes", "oculusnsfw", "CrossEyedFap", "TitsAssandNoClass", "formylover", "Ass_and_Titties", "Ranked_Girls", "fapfactory", "fapfapfap", "NSFW_hardcore", "Sexyness", "debs_and_doxies", "nsfwonly", "pornpedia", "lineups", "nsfw2048", "Nightlysex", "spod", "nsfwnew", "pinupstyle", "NoBSNSFW", "awwyea", "nsfwdumps", "FoxyLadies", "nsfwcloseups", "LuckyCameraman", "NudeBeauty", "SimplyNaked", "fappygood", "FaptasticImages", "WhichOneWouldYouPick", "TumblrPorn", "SaturadayMorningGirls", "NSFWSector", "GirlsWithBigGuns", "QualityNsfw", "nsfwPhotoshopBattles", "hawtness", "fapb4momgetshome", "SeaSquared", "FlashyGirls"],
    //gifs
  gifs: ["NSFW_GIF", "nsfw_gifs", "NSFW_HTML5", "porn_gifs", "adultgifs", "randomsexygifs", "XXX_Animated_Gifs", "PornGifs", "motiontrackedboobs", "NSFW_SEXY_GIF", "nsfwgif", "NSFW_GFY", "MotionTrackedPorn", "porninfifteenseconds", "chixxx_gifs", "Penetration_gifs", "prongifs", "sexgifs", "rud_fuckers", "nsfwHTML5"],
    //humorous
  humorous: ["NSFWFunny", "ConfusedBoners", "Glorp", "nsfw_funny", "Porn_Plots", "titler", "nsfw_GifSound", "WouldNotBang", "KelloggsGoneWild", "KnottyMemes", "horsemaskgw"],
    //p.o.v.
  pov: ["femalpov", "POVPornVids", "POV", "POVPornPics"],
    //passionate
  passionate: ["passionx", "PassionSex", "PassionYZ", "passionpics"],
    //porn for women
  pornForWomen: ["chickflixxx"],
    //videos
  videos: ["pornvids", "nsfw_videos", "Exxxtras", "nsfwvideos", "freexxxvideos", "nudevines", "AdultMovies", "pornhighlights", "worldclassporn", "softcorenights", "Porn_Tubes", "nsfwvine", "NSFW_Vids", "worldstarUNCUT", "FullNSFWMovies"],
  //groups
  groups: ["Sexy_Ed", "BeautyQueenPorn"],
    //alt
  alt: ["FestiveSluts", "SceneGirls", "PunkGirls", "emogirls", "ravergirl", "PunkLovers", "iloveemos", "RaveGirls", "metalgirls", "SceneBoys", "emoporn"],
    //athlete
  athlete: ["fitgirls", "AthleticGirls", "Ohlympics", "NSFW_Hardbodies", "LockerRoom", "GymnastGirls", "Worldsupgirls", "waterpoloboobs", "GirlsWithBikes", "surfinggirls", "AnyoneForTennis", "girlsboxing"],
    //camgirl
  camgirl: ["camwhores", "SluttyStrangers", "GirlsGoneBitcoin", "BestOfCamGirls", "ThePlayroom", "myfreecams"],
    //celebrity
  celebrity: ["celebnsfw", "CelebrityPussy", "celebsnaked", "fuxtaposition", "CelebrityButts", "nsfwcelegifs", "CelebrityNipples", "nsfwcelebs", "nakedcelebs", "NakedFamousPeople", "rawcelebs", "CelebrityHardcore", "kpopfap", "CelebOops", "onoffceleb", "CelebrityPokies", "FMN", "LadyGagaAss", "Celebsreality", "nsfw_celebrity", "CelebNudes", "celebnipslips", "CelebrityPenis", "celebupskirts", "celebunleashed", "CelebSexScenes"],
    //country
  country: ["countrygirls"],
    //nerd
  nerd: ["DirtyGaming", "girlsdoingnerdythings", "BookNymphs"],
    //pornstar
  pornstar: ["PornStars", "Strippersonthejob", "PornstarsAfterHours", "GirlsonStripperPoles"],
      //pornstar lookalike
  pornstarLookalike: ["doppelbangher", "dopplebangher"],
    //religious
  religious: ["ChristianGirls", "sacrilicious"],
    //specific personality
  specificPersonality: ["bimbofetish", "bimbofication", "WellWornBimbos", "bimboxxx"],
  //lgbt
    //bisexual
  bisexual: ["Bisexy", "heteroflexible"],
    //crossdressing
  crossdressing: ["FemBoys", "men_in_panties"],
    //gay
  gay: ["broslikeus", "TotallyStraight", "gaynsfw", "lovegaymale", "gayporn", "twinks", "GayGifs", "manlove", "gaybears", "CuteGuyButts", "gaycumsluts", "manass", "GayDaddiesPics", "gayotters", "Singlets", "jockstraps", "TwinkLove", "Guyskissing", "ManSex", "GayChubs", "Homosexual", "malepornstars", "NSFW_GAY", "gaypornwithplot"],
    //lesbian
  lesbian: ["lesbians", "StraightGirlsPlaying", "girlskissing", "mmgirls", "scissoring", "dyke", "titstouchingtits", "GirlsCuddling", "sappho", "amateurlesbians", "Lesbian_gifs", "Lesbos", "Ass_to_ssA", "Ass_to_Ass", "sapphicgifs"],
    //transgender
  transgender: ["genderotica", "autogynephilia"],
    //transsexual
  transsexual: ["Tgirls", "traps", "Shemales", "Tgifs", "bigdickgirl", "sexytgirls", "trapgifs", "Transex", "cocklady", "DeliciousTraps", "shemale_gifs", "tsexual", "tbulges", "dickgirls", "TGirl_Tube", "thirdgender", "SexyShemales", "shemale", "tflop", "TgirlGIFS", "POVTranny"],
  //literary
  literary: ["xxxcaptions"],
  //locations
    //man-made
  manMade: ["HotInTheKitchen", "HereInMyCar", "LaundryDay", "GirlsInMessyRooms", "GirlsInTanningBeds", "librarygirls"],
    //nature
  nature: ["NotSafeForNature", "WoodNymphs", "snowgirls", "OutDoorSex", "NSFW_Outdoors"],
      //beach
  beach: ["SUMMERtimeheat", "beachgirls", "NudeBeach", "lifeisabeach", "nudist_beach"],
  //sex
  sex: ["holdthemoan", "outercourse", "pussyjobs", "GirlsOnTop", "Hotdogging", "Pounding", "pronebone", "sweatysex", "ballsucking", "milkingtable", "barebacksex", "Buttjobs"],
    //anal
  anal: ["anal", "painal", "buttsex", "upherbutt", "AnalPorn", "CumFromAnal", "anal_gifs", "buttsthatgrip", "ILikeLittleButts", "anal_addiction", "SkinnyAnal", "AnalLadies", "femaleasiananal", "AnalWreakage", "thebackdoor", "Roughanal", "AnalOrgasms"],
      //gaping
  gaping: ["gape"],
      //rimming
  rimming: ["asslick", "anilingus"],
    //breasts
  sexBreasts: ["titfuck", "NibbleMyNipples"],
    //fisting
  fisting: ["Fisting", "AnalFisting"],
    //group
  sexGroup: ["Xsome", "dpgirls"],
      //large group
  largeGroup: ["GroupOfNudeGirls", "groupsex", "gangbang", "blowbang", "AirTight", "Triplepenetration"],
      //swinging
  swinging: ["wifesharing", "Hotwife", "WouldYouFuckMyWife", "WeddingRinsShowing", "slutwife", "wifeshare", "wifeporn"],
      //threesome
  threesome: ["blowjobsandwich", "SpitRoasted", "Threesome", "doublepenetration", "RealThreesomes", "doubletrouble", "DPSEX", "dp_porn"],
    //insertion
  insertion: ["insertions", "Objects", "ButtSharpies", "analinsertions", "foodfuckers"],
    //interracial
  interracial: ["blackchickswhitedicks", "damngoodinterracial", "JungleFever", "mandingo", "interracial_porn", "Interracial_Hardcore"],
    //masturbation
  masturbation: ["jilling", "gettingherselfoff", "Handjob", "GirlsWatchingPorn", "jilling_under_panties", "selfservice", "autofellatio", "jacking", "jackAndjill", "GirlsHoldingDicks"],
    //oral
  oral: ["Blowjobs", "OnHerKnees", "deepthroat", "BlowjobGifs", "cunnilingus", "FaceFuck", "dreamjobs", "OralSex", "Throatfucking", "Blowjob", "fellatio", "lickingdick", "SwordSwallowers", "gag_spit", "AnOralFixation", "BlowjobEyeContact", "DeepThroatTears", "gag", "roadhead", "tongueoutbjs", "MouthStretching"],
    //orgasm
  orgasm: ["Orgasms", "orgasmcontrol", "Womenorgasm", "cripplingorgasm"],
    //toys
  toys: ["buttplug", "suctiondildos", "GirlsWithToys", "tailplug", "SexToys", "strapon", "sybian", "MenWithToys", "plugged", "GirlPlay"],
  //specific actor/actress
  specificActorActress: ["MyCherryCrush", "KateeOwen", "Anjeclica_Ebbi", "Stoyaxxx", "patriciacaprice", "Sashagrey", "TheRedFox", "GiannaMichaels", "FayeReagan", "TessaFowler", "LexiBelle", "arielrebel", "AbbyWinters", "VictoriaRaeBlack", "RemyLaCroix", "SaraJUnderwood", "EmilyBloom", "BaileyJay", "rosie_jones", "MalenaMorgan", "MarialRyabushkina", "Ginerpuss", "MelissaDebling", "Tori_Black", "JordanCarver", "igawyrwal", "RileyReid", "assaakira", "helgalovekaty", "leannadecker", "Lass", "LittleCaprice", "TeenKasia", "Lucy_Vixen", "lucypinder", "Christy_Mack", "KatyaClover", "mellisaclarke", "DionneDaniels", "DaniDaniels", "jennahaze", "chronianuit", "TiffanyThompson", "Tokyogirl", "bryci", "augustames", "LilyC", "miela", "DioraBaird", "JamesDeen", "JulieKennedy", "MiaSollis", "alinali", "londonandrews", "CarlottaChampagne", "emmaglover", "AriaGiovanni", "ericacampbell", "NeverUniteMe", "Alla_Girl", "MiaMalkova", "RosieJones", "jenniferwhite", "jenni_gregg", "BiancaBeauchhamp", "airel_model", "briebby", "MissIvyJean", "AlexisTexas", "maleana_morgan", "personallyyours", "Lelia_GW", "YoungMonroe", "JennieJune", "SarinaValentina", "Hitomi_Tanaka", "FoxyDi", "Lisa_Ann", "JanaDefi", "Calicoo", "cheekyasian", "JynxMaze", "Ashlynn_Brooke", "SaraJay", "GirlWithThePiercings", "IvySnow", "JennyPoussin", "AbellaAnderson", "whiskey_bent", "madison_ivy", "amberblank", "HannaHilton", "JenSelter", "Hayden_Winters", "AmyAnderssen", "Jenya_D", "skindiamond", "MaryJaneJohnson", "eva_angelina", "Maria_Ozawa", "Caitlyn87", "NessaDevil", "ignoscemihi", "alisonangel", "WendyFiore", "anachronia", "ElaySmith", "theartbigtits", "BibiJones", "CelesteStar", "MissAlice_18", "NaughtyAlysha", "shay_laren", "Turnsmeon", "TeamVRB", "anneli", "hashtagy0l0swaggang", "Indiana_A", "holycherriesbatcave", "TheresaTaTa"],
  //specific company
  specificCompany: ["suicidegirls", "metart", "Page3Glamour", "Playboy", "Joymii", "xart", "Twistys", "AmateureAllure", "frontmagazine", "nubilefilms", "Hegre", "NutsBabes", "meinmyplace", "VictoriaSecret", "ifeelmyself", "xartbabes"],
  //wtf
  wtf: ["nwfw_wtf", "WhyWouldYouFuckThat", "WTF_PORN_GIFS"],
  
  async execute(message, args) {
    if(message.channel.nsfw === false) {
      return message.channel.send("Please use an NSFW channel to use this command!")
    }
    var subs = [];
    var tags = [];
    var more = [];
    
    switch(args[0] ? args[0].toLowerCase() : undefined) {
      case "age":
        tags.push("age");
        switch(args[1] ? args[1].toLowerCase() : undefined) {
          case "college":
            tags.push("college");
            for(var i = 0; i < this.college.length; i++) {
              var s = this.college.length - 1;
              while(s > 0) {
                subs.push(this.college[i]);
                s--;
              }
            }
            break;
          case "milf":
            tags.push("milf");
            for(var i = 0; i < this.milf.length; i++) {
              var s = this.milf.length - 1;
              while(s > 0) {
                subs.push(this.milf[i]);
                s--;
              }
            }
            break;
          case "mature":
            tags.push("mature");
            for(var i = 0; i < this.mature.length; i++) {
              var s = this.mature.length - 1;
              while(s > 0) {
                subs.push(this.mature[i]);
                s--;
              }
            }
            break;
          case "teen":
            tags.push("teen");
            for(var i = 0; i < this.teen.length; i++) {
              var s = this.teen.length - 1;
              while(s > 0) {
                subs.push(this.teen[i]);
                s--;
              }
            }
            break;
          default:
            more = ["college", "milf", "mature", "teen"]
            subs = [this.college[0], this.college[1], this.milf[0], this.milf[1], this.mature[0], this.mature[1], this.teen[0], this.teen[1]];
            break;        
          }
        break;
      case "amateur":
            tags.push("amateur");
        switch(args[1] ? args[1].toLowerCase() : undefined) {
          case "self-shots":
          case "self_shots":
          case "self":
            tags.push("self-shots");
            for(var i = 0; i < this.selfShots.length; i++) {
              var s = this.selfShots.length - 1;
              while(s > 0) {
                subs.push(this.selfShots[i]);
                s--;
              }
            }
            break;
          default:
            more = ["self-shots"];
            for(var i = 0; i < this.amateur.length; i++) {
              var s = this.amateur.length - 1;
              while(s > 0) {
                subs.push(this.amateur[i]);
                s--;
              }
            }
            break;
        }
        break;
      case "appearance":
            tags.push("appearance");
        switch(args[1] ? args[1].toLowerCase() : undefined) {
          case "appearance_modification":
          case "modification":
            tags.push("appearance modification");
            switch(args[2] ? args[2].toLowerCase() : undefined) {
              case "piercings":
                for(var i = 0; i < this.piercings.length; i++) {
                  var s = this.piercings.length - 1;
                  while(s > 0) {
                    subs.push(this.piercings[i]);
                    s--;
                  }
                }
                break;
              case "tattoos":
            tags.push("tattoos");
                for(var i = 0; i < this.tattoos.length; i++) {
                  var s = this.tattoos.length - 1;
                  while(s > 0) {
                    subs.push(this.tattoos[i]);
                    s--;
                  }
                }
                break;
              default:
                more = ["piercings", "tattoos"];
                for(var i = 0; i < this.appearanceModification.length; i++) {
                  var s = this.appearanceModification.length - 1;
                  while(s > 0) {
                    subs.push(this.appearanceModification[i]);
                    s--;
                  }
                }
                break;
            }
            break;
          case "clothing":
            tags.push("clothing");
            switch(args[2] ? args[2].toLowerCase() : undefined) {
              case "bodyparts_through_clothes":
              case "through_clothes":
              case "through":
              case "thru":
            tags.push("bodyparts through clothes");
                for(var i = 0; i < this.bodypartsThroughClothes.length; i++) {
                  var s = this.bodypartsThroughClothes.length - 1;
                  while(s > 0) {
                    subs.push(this.bodypartsThroughClothes[i]);
                    s--;
                  }
                }
                break;
              case "bottomless":
            tags.push("bottomless");
                for(var i = 0; i < this.bottomless.length; i++) {
                  var s = this.bottomless.length - 1;
                  while(s > 0) {
                    subs.push(this.bottomless[i]);
                    s--;
                  }
                }
                break;
              case "clothed/naked_pair":
              case "clothed_pair":
              case "naked_pair":
              case "clothed_naked":
              case "pair":
            tags.push("colthed/naked pair");
                for(var i = 0; i < this.clothedNakedPair.length; i++) {
                  var s = this.clothedNakedPair.length - 1;
                  while(s > 0) {
                    subs.push(this.clothedNakedPair[i]);
                    s--;
                  }
                }
                break;
              case "dresses":
            tags.push("dresses");
                for(var i = 0; i < this.dresses.length; i++) {
                  var s = this.dresses.length - 1;
                  while(s > 0) {
                    subs.push(this.dresses[i]);
                    s--;
                  }
                }
                break;
              case "shoes":
            tags.push("shoes");
                for(var i = 0; i < this.shoes.length; i++) {
                  var s = this.shoes.length - 1;
                  while(s > 0) {
                    subs.push(this.shoes[i]);
                    s--;
                  }
                }
                break;
              case "stockings": 
            tags.push("stockings");
                for(var i = 0; i < this.stockings.length; i++) {
                  var s = this.stockings.length - 1;
                  while(s > 0) {
                    subs.push(this.stockings[i]);
                    s--;
                  }
                }
                break;
              case "swimwear":
            tags.push("swimwear");
                for(var i = 0; i < this.swimwear.length; i++) {
                  var s = this.swimwear.length - 1;
                  while(s > 0) {
                    subs.push(this.swimwear[i]);
                    s--;
                  }
                }
                break;
              case "tight_clothing":
              case "tight":
            tags.push("tight clothing");
                for(var i = 0; i < this.tightClothing.length; i++) {
                  var s = this.tightClothing.length - 1;
                  while(s > 0) {
                    subs.push(this.tightClothing[i]);
                    s--;
                  }
                }
                break;
              case "topless":
            tags.push("topless");
                for(var i = 0; i < this.topless.length; i++) {
                  var s = this.topless.length - 1;
                  while(s > 0) {
                    subs.push(this.topless[i]);
                    s--;
                  }
                }
                break;
              case "underwear":
            tags.push("underwear");
                switch(args[3] ? args[3].toLowerCase() : undefined) {
                  case "panties":
            tags.push("panties");
                    for(var i = 0; i < this.panties.length; i++) {
                      var s = this.panties.length - 1;
                      while(s > 0) {
                      subs.push(this.panties[i]);
                      s--;
                      }
                    }
                    break;
                  case "thongs":
            tags.push("thongs");
                    for(var i = 0; i < this.thongs.length; i++) {
                      var s = this.thongs.length - 1;
                      while(s > 0) {
                      subs.push(this.thongs[i]);
                      s--;
                      }
                    }
                    break;
                  default:
                    more = ["panties", "thongs"];
                    for(var i = 0; i < this.underwear.length; i++) {
                      var s = this.underwear.length - 1;
                      while(s > 0) {
                        subs.push(this.underwear[i]);
                        s--;
                      }
                    }
                    break;
                }
                break;
              case "uniforms/outfits":
              case "uniforms":
              case "outfits":
            tags.push("uniform/outfits");
                switch(args[3] ? args[3].toLowerCase() : 0) {
                  case "cosplay":
            tags.push("cosplay");
                    for(var i = 0; i < this.cosplay.length; i++) {
                      var s = this.cosplay.length - 1;
                      while(s > 0) {
                        subs.push(this.cosplay[i]);
                        s--;
                      }
                    }
                    break;
                  default:
                    more = ["cosplay"];
                    for(var i = 0; i < this.uniformsOutfits.length; i++) {
                      var s = this.uniformsOutfits.length - 1;
                      while(s > 0) {
                        subs.push(this.uniformsOutfits[i]);
                        s--;
                      }
                    }
                    break;
                }
                break;
              default:
                more = ["bodyparts_thourgh_clothes"];
                for(var i = 0; i < this.clothing.length; i++) {
                  var s = this.clothing.length - 1;
                  while(s > 0) {
                    subs.push(this.clothing[i]);
                    s--;
                  }
                }
                break;
            }
            break;
          case "expressions":
            tags.push("expressions");
            for(var i = 0; i < this.expressions.length; i++) {
              var s = this.expressions.length - 1;
              while(s > 0) {
                subs.push(this.expressions[i]);
                s--;
              }
            }
            break;
          case "pose":
            tags.push("pose");
            for(var i = 0; i < this.pose.length; i++) {
              var s = this.pose.length - 1;
              while(s > 0) {
                subs.push(this.pose[i]);
                s--;
              }
            }
            break;
          case "wet&messy":
          case "wet":
          case "messy":
            tags.push("wet & messy");
            for(var i = 0; i < this.wetNmessy.length; i++) {
              var s = this.wetNmessy.length - 1;
              while(s > 0) {
                subs.push(this.wetNmessy[i]);
                s--;
              }
            }
            break;
          default:
            more = ["appearance_modification", "clothing", "expressions", "pose", "wet&messy"]
            for(var i = 0; i < this.appearance.length; i++) {
              var s = this.appearance.length - 1;
              while(s > 0) {
                subs.push(this.appearance[i]);
                s--;
              }
            }
            break;
        }
        break;
      case "body_parts":
      case "parts":
            tags.push("body parts");
        switch(args[1] ? args[1].toLowerCase() : 0) {
          case "head":
            tags.push("head");
            switch(args[2] ? args[2].toLowerCase() : 0) {
              case "hair":
            tags.push("hair");
                switch(args[3] ? args[3].toLowerCase() : 9) {
                  case "blonde":
            tags.push("blonde");
                    for(var i = 0; i < this.blonde.length; i++) {
                      var s = this.blonde.length - 1;
                      while(s > 0) {
                        subs.push(this.blonde[i]);
                        s--;
                      }
                    }
                    break;
                  case "brunette":
            tags.push("brunette");
                    for(var i = 0; i < this.brunette.length; i++) {
                      var s = this.brunette.length - 1;
                      while(s > 0) {
                        subs.push(this.brunette[i]);
                        s--;
                      }
                    }
                    break;
                  case "dyed":
            tags.push("dyed");
                    for(var i = 0; i < this.dyed.length; i++) {
                      var s = this.dyed.length - 1;
                      while(s > 0) {
                        subs.push(this.dyed[i]);
                        s--;
                      }
                    }
                    break;
                  case "hairstyle":
            tags.push("hairstyle");
                    for(var i = 0; i < this.hairstyle.length; i++) {
                      var s = this.hairstyle.length - 1;
                      while(s > 0) {
                        subs.push(this.hairstyle[i]);
                        s--;
                      }
                    }
                    break;
                  case "redhead":
            tags.push("redhead");
                    for(var i = 0; i < this.redhead.length; i++) {
                      var s = this.redhead.length - 1;
                      while(s > 0) {
                        subs.push(this.redhead[i]);
                        s--;
                      }
                    }
                    break;
                  default:
                    more = ["blonde", "brunette", "dyed", "hairstyle", "redhead"];
                    for(var i = 0; i < this.hair.length; i++) {
                      var s = this.hair.length - 1;
                      while(s > 0) {
                        subs.push(this.hair[i]);
                        s--;
                      }
                    }
                    break;
                }
                break;
              case "lips/mouth":
              case "lips":
              case "mouth":
            tags.push("lips/mouth");
                for(var i = 0; i < this.lipsMouth.length; i++) {
                  var s = this.lipsMouth.length - 1;
                  while(s > 0) {
                    subs.push(this.lipsMouth[i]);
                    s--;
                  }
                }
                break;
              default:
                more = ["hair", "lips/mouth"];
                subs = [this.hair[0], this.blonde[0], this.blonde[1], this.brunette[0], this.brunette[1], this.dyed[0], this.hairstyle[0], this.hairstyle[1], this.redhead[0], this.redhead[1], this.lipsMouth[0], this.lipsMouth[1]]
                break;
            }
            break;
          case "lower_body":
          case "lower":
            tags.push("lower body");
            switch(args[2] ? args[2].toLowerCase() : 0) {
              case "ass":
            tags.push("ass");
                switch(args[3] ? args[3].toLowerCase() : 0) {
                  case "large":
            tags.push("large");
                    for(var i = 0; i < this.large.length; i++) {
                      var s = this.large.length - 1;
                      while(s > 0) {
                        subs.push(this.large[i]);
                        s--;
                      }
                    }
                    break;
                  default:
                    more = ["large"];
                    for(var i = 0; i < this.ass.length; i++) {
                      var s = this.ass.length - 1;
                      while(s > 0) {
                        subs.push(this.ass[i]);
                        s--;
                      }
                    }
                    break;
                }
                break;
              case "asshole":
            tags.push("asshole");
                for(var i = 0; i < this.asshole.length; i++) {
                  var s = this.asshole.length - 1;
                  while(s > 0) {
                    subs.push(this.asshole[i]);
                    s--;
                  }
                }
                break;
              case "feet":
            tags.push("feet");
                for(var i = 0; i < this.feet.length; i++) {
                  var s = this.feet.length - 1;
                  while(s > 0) {
                    subs.push(this.feet[i]);
                    s--;
                  }
                }
                break;
              case "gap":
            tags.push("gap");
                for(var i = 0; i < this.gap.length; i++) {
                  var s = this.gap.length - 1;
                  while(s > 0) {
                    subs.push(this.gap[i]);
                    s--;
                  }
                }
                break;
              case "genitalia":
            tags.push("genitalia");
                switch(args[3]? args[3].toLowerCase() : 0) {
                  case "penis":
            tags.push("penis");
                    switch(args[4] ? args[4].toLowerCase() : 0) {
                      case "large":
            tags.push("large");
                        for(var i = 0; i < this.penisLarge.length; i++) {
                          var s = this.penisLarge.length - 1;
                          while(s > 0) {
                            subs.push(this.penisLarge[i]);
                            s--;
                          }
                        }
                        break;
                      case "small":
            tags.push("small");
                        for(var i = 0; i < this.penisSmall.length; i++) {
                          var s = this.penisSmall.length - 1;
                          while(s > 0) {
                            subs.push(this.penisSmall[i]);
                            s--;
                          }
                        }
                        break;
                      default:
                        more = ["large", "small"];
                        for(var i = 0; i < this.penis.length; i++) {
                          var s = this.penis.length - 1;
                          while(s > 0) {
                            subs.push(this.penis[i]);
                            s--;
                          }
                        }
                        break;
                    }
                    break;
                  case "vulva":
            tags.push("vulva");
                    switch(args[4] ? args[4].toLowerCase() : 0) {
                      case "hair":
            tags.push("hair");
                        for(var i = 0; i < this.vulvaHair.length; i++) {
                          var s = this.vulvaHair.length - 1;
                          while(s > 0) {
                            subs.push(this.vulvaHair[i]);
                            s--;
                          }
                        }
                        break;
                      case "labia":
            tags.push("labia");
                        for(var i = 0; i < this.vulvaLabia.length; i++) {
                          var s = this.vulvaLabia.length - 1;
                          while(s > 0) {
                            subs.push(this.vulvaLabia[i]);
                            s--;
                          }
                        }
                        break;
                      default:
                        more = ["hair", "labia"];
                        for(var i = 0; i < this.vulva.length; i++) {
                          var s = this.vulva.length - 1;
                          while(s > 0) {
                            subs.push(this.vulva[i]);
                            s--;
                          }
                        }
                        break;
                    }
                    break;
                  default:
                    more = ["penis", "vulva"];
                    subs = [this.penis[0], this.penis[1], this.penisLarge[0], this.penisLarge[1], this.penisSmall[0], this.penisSmall[1], this.vulva[0], this.vulva[1], this.vulvaHair[0], this.vulvaHair[1], this.vulvaLabia[0], this.vulvaLabia[1]];
                    break;
                }
                break;
              case "hips":
            tags.push("hips");
                for(var i = 0; i < this.hips.length; i++) {
                  var s = this.hips.length - 1;
                  while(s > 0) {
                    subs.push(this.hips[i]);
                    s--;
                  }
                }
                break;
              case "legs":
            tags.push("legs");
                for(var i = 0; i < this.legs.length; i++) {
                  var s = this.legs.length - 1;
                  while(s > 0) {
                    subs.push(this.legs[i]);
                    s--;
                  }
                }
                break;
              default:
                more = ["ass", "asshole", "feet", "gap", "genitalia", "hips", "legs"];
                for(var i = 0; i < this.lowerBody.length; i++) {
                  var s = this.lowerBody.length - 1;
                  while(s > 0) {
                    subs.push(this.lowerBody[i]);
                    s--;
                  }
                }
                break;
            }
            break;
          case "upper_body":
          case "upper":
            tags.push("upper body");
            switch(args[2] ? args[2].toLowerCase() : 0) {
              case "breasts":
            tags.push("breasts");
                switch(args[3] ? args[3].toLowerCase() : 0) {
                  case "from_an_angle":
                  case "angle":
            tags.push("from an angle");
                    for(var i = 0; i < this.fromAnAngle.length; i++) {
                      var s = this.fromAnAngle.length - 1;
                      while(s > 0) {
                        subs.push(this.fromAnAngle[i]);
                        s--;
                      }
                    }
                    break;
                  case "implants":
            tags.push("implants");
                    for(var i = 0; i < this.implants.length; i++) {
                      var s = this.implants.length - 1;
                      while(s > 0) {
                        subs.push(this.implants[i]);
                        s--;
                      }
                    }
                    break;
                  case "large":
            tags.push("large");
                    for(var i = 0; i < this.breastLarge.length; i++) {
                      var s = this.breastLarge.length - 1;
                      while(s > 0) {
                        subs.push(this.breastLarge[i]);
                        s--;
                      }
                    }
                    break;
                  case "nipples":
            tags.push("nipples");
                    for(var i = 0; i < this.nipples.length; i++) {
                      var s = this.nipples.length - 1;
                      while(s > 0) {
                        subs.push(this.nipples[i]);
                        s--;
                      }
                    }
                    break;
                  case "small":
            tags.push("small");
                    for(var i = 0; i < this.breastSmall.length; i++) {
                      var s = this.breastSmall.length - 1;
                      while(s > 0) {
                        subs.push(this.breastSmall[i]);
                        s--;
                      }
                    }
                    break;
                  default:
                    more = ["from_an_angle", "implants", "large", "nipples", "small"];
                    for(var i = 0; i < this.breasts.length; i++) {
                      var s = this.breasts.length - 1;
                      while(s > 0) {
                        subs.push(this.breasts[i]);
                        s--;
                      }
                    }
                    break;
                }
                break;
              default:
                more = ["breasts"]
                for(var i = 0; i < this.upperBody.length; i++) {
                  var s = this.upperBody.length - 1;
                   while(s > 0) {
                    subs.push(this.upperBody[i]);
                    s--;
                  }
                }
                break;
            }
            break;
        }
        break;
      case "body_traits":
      case "traits":
            tags.push("body traits");
        switch(args[1] ? args[1].toLowerCase() : 0) {
          case "complexion":
            tags.push("complexion");
            switch(args[2] ? args[2].toLowerCase() : 0) {
              case "freckles":
            tags.push("freckles");
                for(var i = 0; i < this.freckles.length; i++) {
                  var s = this.freckles.length - 1;
                   while(s > 0) {
                    subs.push(this.freckles[i]);
                    s--;
                  }
                }
                break;
              case "light_skin":
              case "light":
            tags.push("light skin");
                for(var i = 0; i < this.lightSkin.length; i++) {
                  var s = this.lightSkin.length - 1;
                   while(s > 0) {
                    subs.push(this.lightSkin[i]);
                    s--;
                  }
                }
                break;
              case "tan":
            tags.push("tan");
                for(var i = 0; i < this.tan.length; i++) {
                  var s = this.tan.length - 1;
                   while(s > 0) {
                    subs.push(this.tan[i]);
                    s--;
                  }
                }
                break;
              default:
                more = ["freckles", "light_skin", "tan"];
                subs = [this.freckles[0], this.freckles[1], this.lightSkin[0], this.lightSkin[1], this.tan[0]]
                break;
            }
            break;
          case "traits":
            tags.push("traits");
            switch(args[2]? args[2].toLowerCase() : 0) {
              case "flexible":
            tags.push("flexible");
                for(var i = 0; i < this.flexible.length; i++) {
                  var s = this.flexible.length - 1;
                   while(s > 0) {
                    subs.push(this.flexible[i]);
                    s--;
                  }
                }
                break;
              case "pregnant":
            tags.push("pregnant");
                for(var i = 0; i < this.pregnant.length; i++) {
                  var s = this.pregnant.length - 1;
                   while(s > 0) {
                    subs.push(this.pregnant[i]);
                    s--;
                  }
                }
                break;
              default:
                more = ["flexible", "pregnant"];
                for(var i = 0; i < this.traits.length; i++) {
                  var s = this.traits.length - 1;
                   while(s > 0) {
                    subs.push(this.traits[i]);
                    s--;
                  }
                }
                break;
            }
            break;
          case "types":
            tags.push("types");
            switch(args[2] ? args[2].toLowerCase() : 0) {
              case "bbw":
            tags.push("bbw");
                for(var i = 0; i < this.bbw.length; i++) {
                  var s = this.bbw.length - 1;
                   while(s > 0) {
                    subs.push(this.bbw[i]);
                    s--;
                  }
                }
                break;
              case "chubby":
            tags.push("chubby");
                for(var i = 0; i < this.chubby.length; i++) {
                  var s = this.chubby.length - 1;
                   while(s > 0) {
                    subs.push(this.chubby[i]);
                    s--;
                  }
                }
                break;
              case "curvy":
            tags.push("curvy");
                for(var i = 0; i < this.curvy.length; i++) {
                  var s = this.curvy.length - 1;
                   while(s > 0) {
                    subs.push(this.curvy[i]);
                    s--;
                  }
                }
                break;
              case "petite":
            tags.push("petite");
                for(var i = 0; i < this.petite.length; i++) {
                  var s = this.petite.length - 1;
                   while(s > 0) {
                    subs.push(this.petite[i]);
                    s--;
                  }
                }
                break;
              case "skinny/thin":
              case "skinny":
              case "thin":
            tags.push("skinny/thin");
                for(var i = 0; i < this.skinnyThin.length; i++) {
                  var s = this.skinnyThin.length - 1;
                   while(s > 0) {
                    subs.push(this.skinnyThin[i]);
                    s--;
                  }
                }
                break;
              default:
                more = ["bbw", "chubby", "curvy", "petite", "skinny/thin"];
                subs = [this.bbw[0], this.bbw[1], this.chubby[0], this.chubby[1], this.curvy[0], this.curvy[1], this.petite[0], this.petite[1], this.skinnyThin[0], this.skinnyThin[1]]
                break;
            }
            break;
          default:
            more = ["complexion", "traits", "types"];
            subs = [this.freckles[0], this.freckles[1], this.lightSkin[0], this.lightSkin[1], this.tan[0], this.bbw[0], this.bbw[1], this.chubby[0], this.chubby[1], this.curvy[0], this.curvy[1], this.petite[0], this.petite[1], this.skinnyThin[0], this.skinnyThin[1]]
            break;
        }
        break;
      case "classic/vintage":
      case "classic":
      case "vintage":
            tags.push("classic/vintage");
        for(var i = 0; i < this.classicVintage.length; i++) {
          var s = this.classicVintage.length - 1;
            while(s > 0) {
             subs.push(this.classicVintage[i]);
              s--;
          }
        }
        break;
      case "cum_play":
      case "cum":
            tags.push("cum play");
        switch(args[1] ? args[1].toLowerCase() : 0) {
          case "cum":
            tags.push("cum");
            switch(args[2] ? args[2].toLowerCase() : 0) {
              case "creampie":
            tags.push("creampie");
                for(var i = 0; i < this.creampie.length; i++) {
                  var s = this.creampie.length - 1;
                   while(s > 0) {
                    subs.push(this.creampie[i]);
                    s--;
                  }
                }
                break;
              case "cum-shot":
              case "shot":
            tags.push("cum-shot");
                switch(args[3] ? args[3].toLowerCase() : 0) {
                  case "bukkake":
            tags.push("bukkake");
                    for(var i = 0; i < this.bukkake.length; i++) {
                      var s = this.bukkake.length - 1;
                       while(s > 0) {
                        subs.push(this.bukkake[i]);
                        s--;
                      }
                    }
                    break;
                  case "facial":
            tags.push("facial");
                    for(var i = 0; i < this.facial.length; i++) {
                      var s = this.facial.length - 1;
                       while(s > 0) {
                        subs.push(this.facial[i]);
                        s--;
                      }
                    }
                    break;
                  default:
                    more = ["bukkake", "facial"];
                    for(var i = 0; i < this.cumShot.length; i++) {
                      var s = this.cumShot.length - 1;
                       while(s > 0) {
                        subs.push(this.cumShot[i]);
                        s--;
                      }
                    }
                    break;
                }
                break;
              case "swallowing":
            tags.push("swallowing");
                for(var i = 0; i < this.swallowing.length; i++) {
                  var s = this.swallowing.length - 1;
                   while(s > 0) {
                    subs.push(this.swallowing[i]);
                    s--;
                  }
                }
                break;
              default:
                more = ["creampie", "cum-shot", "swallowing"];
                for(var i = 0; i < this.cum.length; i++) {
                  var s = this.cum.length - 1;
                   while(s > 0) {
                    subs.push(this.cum[i]);
                    s--;
                  }
                }
                break;
            }
            break;
          case "female":
            tags.push("female");
            for(var i = 0; i < this.female.length; i++) {
              var s = this.female.length - 1;
               while(s > 0) {
                subs.push(this.female[i]);
                s--;
              }
            }
            break;
          default:
            more = ["cum", "female"];
            subs = [this.cum[0], this.cum[1], this.creampie[0], this.creampie[1], this.cumShot[0], this.cumShot[1], this.bukkake[0], this.bukkake[1], this.facial[0], this.facial[1], this.swallowing[0], this.swallowing[1], this.female[0], this.female[1]]
            break;
        }
        break;
      case "ethnicity":
            tags.push("ethnicity");
        switch(args[1] ? args[1].toLowerCase() : 0) {
          case "asian":
            tags.push("asian");
            for(var i = 0; i < this.asian.length; i++) {
              var s = this.asian.length - 1;
               while(s > 0) {
                subs.push(this.asian[i]);
                s--;
              }
            }
            break;
          case "black":
            tags.push("black");
            for(var i = 0; i < this.black.length; i++) {
              var s = this.black.length - 1;
               while(s > 0) {
                subs.push(this.black[i]);
                s--;
              }
            }
            break;
          case "euro":
            tags.push("euro");
            for(var i = 0; i < this.euro.length; i++) {
              var s = this.euro.length - 1;
               while(s > 0) {
                subs.push(this.euro[i]);
                s--;
              }
            }
            break;
          case "indian":
            tags.push("indian");
            for(var i = 0; i < this.indian.length; i++) {
              var s = this.indian.length - 1;
               while(s > 0) {
                subs.push(this.indian[i]);
                s--;
              }
            }
            break;
          case "japanese":
            tags.push("japanese");
            for(var i = 0; i < this.japanese.length; i++) {
              var s = this.japanese.length - 1;
               while(s > 0) {
                subs.push(this.japanese[i]);
                s--;
              }
            }
            break;
          default:
            more = ["asian", "black", "euro", "indian", "japanese"];
            for(var i = 0; i < this.ethnicity.length; i++) {
              var s = this.ethnicity.length - 1;
               while(s > 0) {
                subs.push(this.ethnicity[i]);
                s--;
              }
            }
            break;
        }
        break;
      case "exhibition":
            tags.push("exhibition");
        switch(args[1] ? args[1].toLowerCase() : 0) {
          case "gonewild":
            tags.push("gonewild");
            for(var i = 0; i < this.gonewild.length; i++) {
              var s = this.gonewild.length - 1;
               while(s > 0) {
                subs.push(this.gonewild[i]);
                s--;
              }
            }
            break;
          case "public":
            tags.push("public");
            for(var i = 0; i < this.public.length; i++) {
              var s = this.public.length - 1;
               while(s > 0) {
                subs.push(this.public[i]);
                s--;
              }
            }
            break;
          default:
            more = ["gonewild", "public"];
            for(var i = 0; i < this.exhibition.length; i++) {
              var s = this.exhibition.length - 1;
               while(s > 0) {
                subs.push(this.exhibition[i]);
                s--;
              }
            }
            break;
        }
        break;
      case "fetish":
            tags.push("fetish");
        switch(args[1] ? args[1].toLowerCase() : 0) {
          case "bdsm":
            tags.push("bdsm");
            switch(args[2] ? args[2].toLowerCase() : 0) {
              case "bondage":
            tags.push("bondage");
                for(var i = 0; i < this.bondage.length; i++) {
                  var s = this.bondage.length - 1;
                   while(s > 0) {
                    subs.push(this.bondage[i]);
                    s--;
                  }
                }
                break;
              case "domination&submission":
              case "domination":
              case "submission":
            tags.push("domination & submission");
                switch(args[3] ? args[3].toLowerCase() : 0) {
                  case "femdom":
            tags.push("femdom");
                    for(var i = 0; i < this.femdom.length; i++) {
                      var s = this.femdom.length - 1;
                       while(s > 0) {
                        subs.push(this.femdom[i]);
                        s--;
                      }
                    }
                    break;
                  default:
                    more = ["femdom"];
                    for(var i = 0; i < this.dominationSubmission.length; i++) {
                      var s = this.dominationSubmission.length - 1;
                       while(s > 0) {
                        subs.push(this.dominationSubmission[i]);
                        s--;
                      }
                    }
                    break;
                }
                break;
              default:
                more = ["bondage", "domination&submission"];
                for(var i = 0; i < this.bdsm.length; i++) {
                  var s = this.bdsm.length - 1;
                  while(s > 0) {
                    subs.push(this.bdsm[i]);
                    s--;
                   }
                }
                break;
            }
            break;
          case "drugs":
            tags.push("drugs");
            for(var i = 0; i < this.drugs.length; i++) {
               var s = this.drugs.length - 1;
               while(s > 0) {
                subs.push(this.drugs[i]);
                s--;
               }
            }
            break;
          case "role_enactment":
          case "role":
            tags.push("role enactment");
            switch(args[2] ? args[2].toLowerCase() : 0) {
              case "age_play":
              case "age":
            tags.push("age play");
                for(var i = 0; i < this.agePlay.length; i++) {
                  var s = this.agePlay.length - 1;
                  while(s > 0) {
                    subs.push(this.agePlay[i]);
                    s--;
                   }
                }
                break;
              case "furry":
            tags.push("furry");
                for(var i = 0; i < this.furry.length; i++) {
                  var s = this.furry.length - 1;
                  while(s > 0) {
                    subs.push(this.furry[i]);
                    s--;
                   }
                }
                break;
              case "pet_play":
              case "pet":
            tags.push("pet play");
                for(var i = 0; i < this.petPlay.length; i++) {
                  var s = this.petPlay.length - 1;
                  while(s > 0) {
                    subs.push(this.petPlay[i]);
                    s--;
                   }
                }
                break;
              case "rape/abuse":
              case "rape":
              case "abuse":
            tags.push("rape/abuse");
                for(var i = 0; i < this.rapeAbuse.length; i++) {
                  var s = this.rapeAbuse.length - 1;
                  while(s > 0) {
                    subs.push(this.rapeAbuse[i]);
                    s--;
                   }
                }
                break;
              default:
                more = ["age_play", "furry", "pet_play", "rape/abuse"];
                for(var i = 0; i < this.roleEnactment.length; i++) {
                  var s = this.roleEnactment.length - 1;
                  while(s > 0) {
                    subs.push(this.roleEnactment[i]);
                    s--;
                   }
                }
                break;
            }
            break;
          case "watersports":
            tags.push("watersports");
            for(var i = 0; i < this.watersports.length; i++) {
              var s = this.watersports.length - 1;
              while(s > 0) {
                subs.push(this.watersports[i]);
                s--;
               }
            }
            break;
          default:
            more = ["bdsm", "drugs", "role_enactment", "watersports"];
            for(var i = 0; i < this.fetish.length; i++) {
              var s = this.fetish.length - 1;
              while(s > 0) {
                subs.push(this.fetish[i]);
                s--;
               }
            }
            break;
        }
        break;
      case "general_categories":
      case "general":
      case "categories":
            tags.push("general categories");
        switch(args[1] ? args[1].toLowerCase() : 0) {
          case "gifs":
            tags.push("gifs");
            for(var i = 0; i < this.gifs.length; i++) {
              var s = this.gifs.length - 1;
              while(s > 0) {
                subs.push(this.gifs[i]);
                s--;
               }
            }
            break;
          case "humorous":
            tags.push("humorous");
            for(var i = 0; i < this.humorous.length; i++) {
              var s = this.humorous.length - 1;
              while(s > 0) {
                subs.push(this.humorous[i]);
                s--;
               }
            }
            break;
          case "p.o.v.":
          case "pov":
            tags.push("p.o.v.");
            for(var i = 0; i < this.pov.length; i++) {
              var s = this.pov.length - 1;
              while(s > 0) {
                subs.push(this.pov[i]);
                s--;
               }
            }
            break;
          case "passionate":
            tags.push("passionate");
            for(var i = 0; i < this.passionate.length; i++) {
              var s = this.passionate.length - 1;
              while(s > 0) {
                subs.push(this.passionate[i]);
                s--;
               }
            }
            break;
          case "porn_for_women":
          case "women_porn":
          case "women":
            tags.push("porn for women");
            for(var i = 0; i < this.pornForWomen.length; i++) {
              var s = this.pornForWomen.length - 1;
              while(s > 0) {
                subs.push(this.pornForWomen[i]);
                s--;
               }
            }
            break;
          case "videos":
            tags.push("videos");
            for(var i = 0; i < this.videos.length; i++) {
              var s = this.videos.length - 1;
              while(s > 0) {
                subs.push(this.videos[i]);
                s--;
               }
            }
            break;
          default:
            more = ["gifs", "humorous", "p.o.v.", "passionate", "porn_for_women", "videos"];
            for(var i = 0; i < this.generalCategories.length; i++) {
              var s = this.generalCategories.length - 1;
              while(s > 0) {
                subs.push(this.generalCategories[i]);
                s--;
               }
            }
            break;
        }
        break;
      case "groups":
            tags.push("groups");
        switch(args[1] ? args[1].toLowerCase() : 0) {
          case "alt":
            for(var i = 0; i < this.alt.length; i++) {
              var s = this.alt.length - 1;
              while(s > 0) {
                subs.push(this.alt[i]);
                s--;
               }
            }
            break;
          case "athlete":
            tags.push("athlete");
            for(var i = 0; i < this.athlete.length; i++) {
              var s = this.athlete.length - 1;
              while(s > 0) {
                subs.push(this.athlete[i]);
                s--;
               }
            }
            break;
          case "camgirl":
            tags.push("camgirl");
            for(var i = 0; i < this.camgirl.length; i++) {
              var s = this.camgirl.length - 1;
              while(s > 0) {
                subs.push(this.camgirl[i]);
                s--;
               }
            }
            break;
          case "celebrity":
            tags.push("celebrity");
            for(var i = 0; i < this.celebrity.length; i++) {
              var s = this.celebrity.length - 1;
              while(s > 0) {
                subs.push(this.celebrity[i]);
                s--;
               }
            }
            break;
          case "country":
            tags.push("country");
            for(var i = 0; i < this.country.length; i++) {
              var s = this.country.length - 1;
              while(s > 0) {
                subs.push(this.country[i]);
                s--;
               }
            }
            break;
          case "nerd":
            tags.push("nerd");
            for(var i = 0; i < this.nerd.length; i++) {
              var s = this.nerd.length - 1;
              while(s > 0) {
                subs.push(this.nerd[i]);
                s--;
               }
            }
            break;
          case "pornstar":
            tags.push("pornstar");
            switch(args[2] ? args[2].toLowerCase() : 0) {
              case "pornstar_lookalike":
              case "lookalike":
            tags.push("pornstar lookalike");
                for(var i = 0; i < this.pornstarLookalike.length; i++) {
                  var s = this.pornstarLookalike.length - 1;
                  while(s > 0) {
                    subs.push(this.pornstarLookalike[i]);
                    s--;
                   }
                }
                break;
              default:
                more = ["pronstar_lookalike"];
                for(var i = 0; i < this.pornstar.length; i++) {
                  var s = this.pornstar.length - 1;
                  while(s > 0) {
                    subs.push(this.pornstar[i]);
                    s--;
                   }
                }
                break;
            }
            break;
          case "religious":
            tags.push("religious");
            for(var i = 0; i < this.religious.length; i++) {
              var s = this.religious.length - 1;
              while(s > 0) {
                subs.push(this.religious[i]);
                s--;
               }
            }
            break;
          case "specific_personality":
          case "personality":
            tags.push("specific personality");
            for(var i = 0; i < this.specificPersonality.length; i++) {
              var s = this.specificPersonality.length - 1;
              while(s > 0) {
                subs.push(this.specificPersonality[i]);
                s--;
               }
            }
            break;
          default:
            more = ["alt", "athlete", "camgirl", "celebrity", "country", "nerd", "pornstar", "religious", "specific_personality"];
            for(var i = 0; i < this.groups.length; i++) {
              var s = this.groups.length - 1;
              while(s > 0) {
                subs.push(this.groups[i]);
                s--;
               }
            }
            break;
        }
        break;
      case "lgbt":
            tags.push("lgbt");
        switch(args[1] ? args[1].toLowerCase() : 0) {
          case "bisexual":
            tags.push("bisexual");
            for(var i = 0; i < this.bisexual.length; i++) {
              var s = this.bisexual.length - 1;
              while(s > 0) {
                subs.push(this.bisexual[i]);
                s--;
               }
            }
            break;
          case "crossdressing":
            tags.push("crossdressing");
            for(var i = 0; i < this.crossdressing.length; i++) {
              var s = this.crossdressing.length - 1;
              while(s > 0) {
                subs.push(this.crossdressing[i]);
                s--;
               }
            }
            break;
          case "gay":
            tags.push("gay");
            for(var i = 0; i < this.gay.length; i++) {
              var s = this.gay.length - 1;
              while(s > 0) {
                subs.push(this.gay[i]);
                s--;
               }
            }
            break;
          case "lesbian":
            tags.push("lesbian");
            for(var i = 0; i < this.lesbian.length; i++) {
              var s = this.lesbian.length - 1;
              while(s > 0) {
                subs.push(this.lesbian[i]);
                s--;
               }
            }
            break;
          case "transgender":
            tags.push("transgender");
            for(var i = 0; i < this.transgender.length; i++) {
              var s = this.transgender.length - 1;
              while(s > 0) {
                subs.push(this.transgender[i]);
                s--;
               }
            }
            break;
          case "transsexual":
            tags.push("transsexual");
            for(var i = 0; i < this.transsexual.length; i++) {
              var s = this.transsexual.length - 1;
              while(s > 0) {
                subs.push(this.transsexual[i]);
                s--;
               }
            }
            break;
          default:
            more = ["bisexual", "crossdressing", "gay", "lesbian", "transgender", "transsexual"];
            subs = [this.bisexual[0], this.bisexual[1], this.crossdressing[0], this.crossdressing[1], this.gay[0], this.gay[1], this.lesbian[0], this.lesbian[1], this.transgender[0], this.transgender[1], this.transsexual[0], this.transsexual[1]];
            break;
        }
        break;
      case "literary":
            tags.push("literary");
        for(var i = 0; i < this.literary.length; i++) {
          var s = this.literary.length - 1;
          while(s > 0) {
            subs.push(this.literary[i]);
            s--;
             }
        }
        break;
      case "locations":
            tags.push("locations");
        switch(args[1] ? args[1].toLowerCase() : 0) {
          case "man-made":
          case "made":
            tags.push("man-made");
            for(var i = 0; i < this.manMade.length; i++) {
              var s = this.manMade.length - 1;
              while(s > 0) {
                subs.push(this.manMade[i]);
                s--;
               }
            }
            break;
          case "nature":
            tags.push("nature");
            switch(args[2] ? args[2].toLowerCase() : 0) {
              case "beach":
            tags.push("beach");
                for(var i = 0; i < this.beach.length; i++) {
                  var s = this.beach.length - 1;
                  while(s > 0) {
                    subs.push(this.beach[i]);
                    s--;
                   }
                }
                break;
              default:
                more = ["beach"];
                for(var i = 0; i < this.nature.length; i++) {
                  var s = this.nature.length - 1;
                  while(s > 0) {
                    subs.push(this.nature[i]);
                    s--;
                   }
                }
                break;
            }
            break;
          default:
            more = ["man-made", "nature"];
            subs = [this.manMade[0], this.manMade[1], this.nature[0], this.nature[1], this.beach[0], this.beach[1]];
            break;
        }
        break;
      case "sex":
            tags.push("sex");
        switch(args[1] ? args[1].toLowerCase() : 0) {
          case "anal":
            tags.push("anal");
            switch(args[2] ? args[2].toLowerCase() : 0) {
              case "gaping":
            tags.push("gaping");
                for(var i = 0; i < this.gaping.length; i++) {
                  var s = this.gaping.length - 1;
                  while(s > 0) {
                    subs.push(this.gaping[i]);
                    s--;
                   }
                }
                break;
              case "rimming":
            tags.push("rimming");
                for(var i = 0; i < this.rimming.length; i++) {
                  var s = this.rimming.length - 1;
                  while(s > 0) {
                    subs.push(this.rimming[i]);
                    s--;
                   }
                }
                break;
              default:
                more = ["gaping", "rimming"];
                for(var i = 0; i < this.anal.length; i++) {
                  var s = this.anal.length - 1;
                  while(s > 0) {
                    subs.push(this.anal[i]);
                    s--;
                   }
                }
                break;
            }
            break;
          case "breasts":
            tags.push("breasts");
            for(var i = 0; i < this.sexBreasts.length; i++) {
              var s = this.sexBreasts.length - 1;
              while(s > 0) {
                subs.push(this.sexBreasts[i]);
                s--;
                }
            }
            break;
          case "fisting":
            tags.push("fisting");
            for(var i = 0; i < this.fisting.length; i++) {
              var s = this.fisting.length - 1;
              while(s > 0) {
                subs.push(this.fisting[i]);
                s--;
                }
            }
            break;
          case "group":
            tags.push("group");
            switch(args[2] ? args[2].toLowerCase() : 0) {
              case "large_group":
              case "large":
            tags.push("large group");
                for(var i = 0; i < this.largeGroup.length; i++) {
                  var s = this.largeGroup.length - 1;
                  while(s > 0) {
                    subs.push(this.largeGroup[i]);
                    s--;
                   }
                }
                break;
              case "swinging":
            tags.push("swinging");
                for(var i = 0; i < this.swinging.length; i++) {
                  var s = this.swinging.length - 1;
                  while(s > 0) {
                    subs.push(this.swinging[i]);
                    s--;
                   }
                }
                break;
              case "threesome":
            tags.push("threesome");
                for(var i = 0; i < this.threesome.length; i++) {
                  var s = this.threesome.length - 1;
                  while(s > 0) {
                    subs.push(this.threesome[i]);
                    s--;
                   }
                }
                break;
              default:
                more = ["large_group", "swinging", "threesome"];
                for(var i = 0; i < this.sexGroup.length; i++) {
                  var s = this.sexGroup.length - 1;
                  while(s > 0) {
                    subs.push(this.sexGroup[i]);
                    s--;
                   }
                }
                break;
            }
            break;
          case "insertion":
            tags.push("insertion");
            for(var i = 0; i < this.insertion.length; i++) {
              var s = this.insertion.length - 1;
              while(s > 0) {
                subs.push(this.insertion[i]);
                s--;
              }
            }
            break;
          case "interracial":
            tags.push("interracial");
            for(var i = 0; i < this.interracial.length; i++) {
              var s = this.interracial.length - 1;
              while(s > 0) {
                subs.push(this.interracial[i]);
                s--;
              }
            }
            break;
          case "masturbation":
            tags.push("masturbation");
            for(var i = 0; i < this.masturbation.length; i++) {
              var s = this.masturbation.length - 1;
              while(s > 0) {
                subs.push(this.masturbation[i]);
                s--;
              }
            }
            break;
          case "oral":
            tags.push("oral");
            for(var i = 0; i < this.oral.length; i++) {
              var s = this.oral.length - 1;
              while(s > 0) {
                subs.push(this.oral[i]);
                s--;
              }
            }
            break;
          case "orgasm":
            tags.push("orgasm");
            for(var i = 0; i < this.orgasm.length; i++) {
              var s = this.orgasm.length - 1;
              while(s > 0) {
                subs.push(this.orgasm[i]);
                s--;
              }
            }
            break;
          case "toys":
            tags.push("toys");
            for(var i = 0; i < this.toys.length; i++) {
              var s = this.toys.length - 1;
              while(s > 0) {
                subs.push(this.toys[i]);
                s--;
              }
            }
            break;
          default:
            more = ["anal", "breasts", "fisting", "group", "insertion", "interracial", "masturbation", "oral", "orgasm", "toys"];
            for(var i = 0; i < this.sex.length; i++) {
              var s = this.sex.length - 1;
              while(s > 0) {
                subs.push(this.sex[i]);
                s--;
              }
            }
            break;
        }
        break;
      case "specific_actor/actress":
      case "specific_actor":
      case "specofoc_actress":
      case "actor":
      case "actress":
            tags.push("specific actor/actress");
        for(var i = 0; i < this.specificActorActress.length; i++) {
          var s = this.specificActorActress.length - 1;
          while(s > 0) {
            subs.push(this.specificActorActress[i]);
            s--;
           }
        }
        break;
      case "specific_company":
      case "company":
            tags.push("specific company");
        for(var i = 0; i < this.specificCompany.length; i++) {
          var s = this.specificCompany.length - 1;
          while(s > 0) {
            subs.push(this.specificCompany[i]);
            s--;
           }
        }
        break;
      case "wtf":
            tags.push("wtf");
        for(var i = 0; i < this.wtf.length; i++) {
          var s = this.wtf.length - 1;
          while(s > 0) {
            subs.push(this.wtf[i]);
            s--;
           }
        }
        break;
      default:
        more = ["age", "amateur", "appearance", "body_parts", "body_traits", "classic/vintage", "cum_play", "ethnicity", "exhibition", "fetish", "general_categories", "groups", "lgbt", "literary", "locations", "sex", "specific_actor/actress", "specific_company", "wtf"];
        subs = [this.college[0], this.milf[0], this.mature[0], this.teen[0], this.amateur[0], this.selfShots[0], this.appearance[0], this.appearanceModification[0], this.piercings[0], this.tattoos[0], this.clothing[0], this.bodypartsThroughClothes[0], this.bottomless[0], this.clothedNakedPair[0], this.dresses[0], this.shoes[0], this.stockings[0], this.swimwear[0], this.tightClothing[0], this.topless[0], this.underwear[0], this.panties[0], this.thongs[0], this.uniformsOutfits[0], this.cosplay[0], this.expressions[0], this.pose[0], this.wetNmessy[0], this.hair[0], this.blonde[0], this.brunette[0], this.dyed[0], this.hairstyle[0], this.redhead[0], this.lipsMouth[0], this.lowerBody[0], this.ass[0], this.large[0], this.asshole[0], this.feet[0], this.gap[0], this.penis[0], this.penisLarge[0], this.penisSmall[0], this.vulva[0], this.vulvaHair[0], this.vulvaLabia[0], this.hips[0], this.legs[0], this.upperBody[0], this.breasts[0], this.fromAnAngle[0], this.implants[0], this.breastLarge[0], this.nipples[0], this.breastSmall[0], this.freckles[0], this.lightSkin[0], this.tan[0], this.traits[0], this.flexible[0], this.pregnant[0], this.bbw[0], this.chubby[0], this.curvy[0], this.petite[0], this.skinnyThin[0], this.classicVintage[0], this.cum[0], this.creampie[0], this.cumShot[0], this.bukkake[0], this.facial[0], this.swallowing[0], this.female[0], this.ethnicity[0], this.asian[0], this.black[0], this.euro[0], this.indian[0], this.japanese[0], this.exhibition[0], this.gonewild[0], this.public[0], this.fetish[0], this.bdsm[0], this.bondage[0], this.dominationSubmission[0], this.femdom[0], this.drugs[0], this.roleEnactment[0], this.agePlay[0], this.furry[0], this.petPlay[0], this.rapeAbuse[0], this.watersports[0], this.generalCategories[0], this.gifs[0], this.humorous[0], this.pov[0], this.passionate[0], this.pornForWomen[0], this.videos[0], this.groups[0], this.alt[0], this.athlete[0], this.camgirl[0], this.celebrity[0], this.country[0], this.nerd[0], this.pornstar[0], this.pornstarLookalike[0], this.religious[0], this.specificPersonality[0], this.bisexual[0], this.crossdressing[0], this.gay[0], this.lesbian[0], this.transgender[0], this.transsexual[0], this.literary[0], this.manMade[0], this.nature[0], this.beach[0], this.sex[0], this.anal[0], this.gaping[0], this.rimming[0], this.sexBreasts[0], this.fisting[0], this.sexGroup[0], this.largeGroup[0], this.swinging[0], this.threesome[0], this.insertion[0], this.interracial[0], this.masturbation[0], this.oral[0], this.orgasm[0], this.toys[0], this.specificActorActress[0], this.specificCompany[0], this.wtf[0]]
        break;
    }
    if(this[args[0]] !== undefined) {
      for(var i = 0; i < this[args[0]].length; i++) {
          var s = this[args[0]].length - 1;
          while(s > 0) {
            subs.push(this[args[0]][i]);
            s--;
           }
        }
    }
    
    var picked = subs[Math.floor(Math.random() * subs.length)];
    
    var response = await redditConn.api.get("/r/" + picked + "/hot", { limit: 100 }).catch(err => console.error(err));
    if(!response || !response[1]) return await this.execute(message, args);
    if(!response[1].data || !response[1].data.children || !response[1].data.children[0]) return await this.execute(message, args);
    var data = response[1].data.children[Math.floor(Math.random() * response[1].data.children.length)].data;
    if(!data || !data.url) return await this.execute(message, args);
    
        const em = new Discord.MessageEmbed()
          .setTitle(`${data.title.substring(0, 256)}`)
        .setDescription(`Tags: \`${tags.length > 0 ? tags.join("->") : "`N/A`"}\`\n(Further tags: \`${more.length > 0 ? more.join("`, `") : "`N/A`"}\`)\nFrom r/${picked}`)
          .setURL(`https://reddit.com${data.permalink}`)
          .setImage(data.url)
          .setColor(color)
          .setFooter(
            `${data.ups} 👍 | ${data.downs} 👎 | ${data.num_comments} 🗨`, message.client.user.displayAvatarURL()
          )
          .setTimestamp();
    if(validNotImgurURL(data.url)) {
      em.setImage(data.url.replace("imgur", "i.imgur") + ".jpg");
    }
    
    if(validImgurURL(data.url) === false && validRedditURL(data.url) === false) {
      if(validImgurVideoURL(data.url) || validRedditVideoURL(data.url)) {
        var link = data.url;
      } else if(validGfyURL(data.url) || validRedGifURL(data.url)) {
        await gfycat.authenticate();
        if(validRedGifURL(data.url))
          var gif = await gfycat.getGifDetails({ gfyId: data.url.split("/")[4]});
        else
          var gif = await gfycat.getGifDetails({ gfyId: data.url.split("/")[3]});
        var name = gif.gfyItem.gfyName;
      var link = `https://thumbs.gfycat.com/${name}-mobile.mp4`;
      } else if(data.media !== null && data.media.type === "gfycat.com") {
      var image = decodeHtmlEntity(data.media.oembed.html).split("&").find(x => x.startsWith("image"));
      if(image === undefined) em.setDescription(`Tags: \`${tags.length > 0 ? tags.join("->") : "`N/A`"}\`\n(Further tags: \`${more.length > 0 ? more.join("`, `") : "`N/A`"}\`)\nFrom r/${picked}\n\nThe post is a [video](${data.url}) from [${data.url.split("/")[2]}](https://${data.url.split("/")[2]}).`).setImage(undefined);
      else {
      var arr = unescape(image).split("/");
    var id = arr[arr.length - 1].split("-")[0];
      var link = `https://thumbs.gfycat.com/${id}-mobile.mp4`;
      }
      
    }
      if(!link) return await this.execute(message, args)
      em.setDescription(`Tags:\`${tags.length > 0 ? tags.join("->") : "`N/A`"}\`\n(Further tags: \`${more.length > 0 ? more.join("`, `") : "`N/A`"}\`)\nFrom r/${picked}\n\nThe post is a [video](${data.url}) from [${data.url.split("/")[2]}](https://${data.url.split("/")[2]}).`).setImage(undefined);
    }

    if(link) {
      try {
      var video = new Discord.MessageAttachment(link, "video.mp4");
      } catch(err) {
        return await this.execute(message, args);
      }
      if(video.size > 8388119) {
        return await this.execute(message, args);
      } else {
      await message.channel.send(em);
      message.channel.send(video);
      }
    } else 
        message.channel.send(em);
  }
}