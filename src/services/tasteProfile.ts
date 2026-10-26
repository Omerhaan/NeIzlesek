import type { Movie, SwipeAction, WatchedMovieEntry, MatchedMovieEntry } from '../types'
import { GENRES } from './tmdb'

export interface TasteProfile {
  userId: string
  username: string
  avatar: string
  isOnboarded: boolean
  coldStartCompleted?: boolean
  genreScores: Record<number, number> // genreId -> score
  likedMovies: Movie[]
  watchedMovieIds: number[]
  watchedMovies: WatchedMovieEntry[]
  passedMovieIds: number[]
  totalSwipes: number
  matchHistory?: MatchedMovieEntry[]
}

const STORAGE_KEY = 'neizlesek_taste_profile_v1'

export const AVATARS = ['🍿', '🎬', '🚀', '🎭', '🦁', '🤖', '🦇', '🧙', '🤠', '🕵️']

// 30 Iconic Movies across genres for Cold-Start calibration
export const COLD_START_MOVIES: Movie[] = [
  // Bilim Kurgu & Macera
  {
    id: 157336,
    title: 'Yıldızlararası',
    original_title: 'Interstellar',
    overview: 'İnsanlığın Dünya üzerindeki zamanı sona ererken, bir grup kâşif insanlık tarihinin en önemli görevini üstlenir: galaksimizin ötesine seyahat ederek insanların yıldızlar arasında bir geleceği olup olmadığını keşfetmek.',
    poster_path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    backdrop_path: '/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
    vote_average: 8.4,
    release_date: '2014-11-05',
    genre_ids: [878, 18],
  },
  {
    id: 27205,
    title: 'Başlangıç',
    original_title: 'Inception',
    overview: 'Dom Cobb, insanların rüya gördükleri sırada bilinçaltının derinliklerindeki değerli sırları çalabilen yetenekli bir hırsızdır. Ancak bu kez görevi bir fikir çalmak değil, yerleştirmektir.',
    poster_path: '/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg',
    backdrop_path: '/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg',
    vote_average: 8.4,
    release_date: '2010-07-15',
    genre_ids: [28, 878, 12],
  },
  {
    id: 603,
    title: 'Matrix',
    original_title: 'The Matrix',
    overview: 'Bir bilgisayar korsanı, yaşadığı dünyanın aslında bir simülasyon olduğunu ve insanlığın makineler tarafından köleleştirildiğini öğrenir.',
    poster_path: '/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
    backdrop_path: '/7u3pxc0K1uhny2GUHGwP49KKa89.jpg',
    vote_average: 8.2,
    release_date: '1999-03-30',
    genre_ids: [28, 878],
  },

  // Aksiyon & Gerilim
  {
    id: 155,
    title: 'Kara Şövalye',
    original_title: 'The Dark Knight',
    overview: 'Batman, Teğmen Gordon ve Savcı Harvey Dent ile birlikte Gotham sokaklarını suçtan arındırmaya çalışırken, şehri kaosa sürükleyen psikopat deha Joker ortaya çıkar.',
    poster_path: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    backdrop_path: '/dqK9Hag1054tghRQSqLSfrkvQnA.jpg',
    vote_average: 8.5,
    release_date: '2008-07-16',
    genre_ids: [18, 28, 53],
  },
  {
    id: 98,
    title: 'Gladyatör',
    original_title: 'Gladiator',
    overview: 'Eski bir Romalı General, ailesini katleden ve kendisini köleliğe mahkum eden yozlaşmış imparatordan intikam almak için gladyatör olarak arenaya çıkar.',
    poster_path: '/ehGpNjh6N1v9U74h89hZ6k7q55S.jpg',
    backdrop_path: '/Ar7H2qFvNtrjK8rF45U8P8n0q6R.jpg',
    vote_average: 8.2,
    release_date: '2000-05-01',
    genre_ids: [28, 18, 12],
  },
  {
    id: 245891,
    title: 'John Wick',
    original_title: 'John Wick',
    overview: 'Emekli bir suikastçı, ölen karısından hediye kalan köpeğini öldüren ve arabasını çalan Rus mafyasının peşine düşer.',
    poster_path: '/wogw1rIq9N5mN17q0pX15jQ7q8k.jpg',
    backdrop_path: '/umC04Cozevu8nn3JTDJ1pc7rCJ8.jpg',
    vote_average: 7.4,
    release_date: '2014-10-22',
    genre_ids: [28, 53],
  },

  // Dram & Başyapıtlar
  {
    id: 278,
    title: 'Esaretin Bedeli',
    original_title: 'The Shawshank Redemption',
    overview: 'İşlemediği bir cinayetten ömür boyu hapse mahkum edilen banker Andy Dufresne, Shawshank hapishanesinde umudu ve dostluğu canlı tutar.',
    poster_path: '/9cqNtx0GqBT88w99fRmj9wqbmTe.jpg',
    backdrop_path: '/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg',
    vote_average: 8.7,
    release_date: '1994-09-23',
    genre_ids: [18],
  },
  {
    id: 550,
    title: 'Dövüş Kulübü',
    original_title: 'Fight Club',
    overview: 'Uykusuzluk çeken sıradan bir ofis çalışanı ve sıra dışı bir sabun satıcısı, yeraltında gizli bir dövüş kulübü kurarak düzene başkaldırır.',
    poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
    backdrop_path: '/hZkgoQYus5vegHoetLkCJzb17zJ.jpg',
    vote_average: 8.4,
    release_date: '1999-10-15',
    genre_ids: [18],
  },
  {
    id: 13,
    title: 'Forrest Gump',
    original_title: 'Forrest Gump',
    overview: 'Düşük zeka seviyesine sahip saf yürekli bir adam, hayatı boyunca tarihi olaylara tanıklık ederken çocukluk aşkı Jenny’ye olan sevgisini asla kaybetmez.',
    poster_path: '/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg',
    backdrop_path: '/7c9UVPPiTPltouxShY9JH934xW1.jpg',
    vote_average: 8.5,
    release_date: '1994-06-23',
    genre_ids: [35, 18, 10749],
  },
  {
    id: 496243,
    title: 'Parazit',
    original_title: 'Gisaengchung',
    overview: 'Yoksul bir ailenin tüm fertleri, zengin bir ailenin evinde çalışan olarak teker teker sızmayı başarır, ancak beklenmedik bir sır dengeleri bozar.',
    poster_path: '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
    backdrop_path: '/hiKmp9Sm99uvY265pce9au9F7b2.jpg',
    vote_average: 8.5,
    release_date: '2019-05-30',
    genre_ids: [35, 53, 18],
  },

  // Komedi
  {
    id: 18785,
    title: 'Felekten Bir Gece',
    original_title: 'The Hangover',
    overview: 'Las Vegas\'ta bekarlığa veda partisi veren üç sağdıç, ertesi sabah odalarında bir kaplan, bir bebek ve kayıp damatla uyanır.',
    poster_path: '/ulmsXDFVtkvP0P0X6u7bV2Xw3eW.jpg',
    backdrop_path: '/8iP2KzX0KqXNqXN0KqXNqXN0KqX.jpg',
    vote_average: 7.3,
    release_date: '2009-06-05',
    genre_ids: [35],
  },
  {
    id: 8363,
    title: 'Çok Fena',
    original_title: 'Superbad',
    overview: 'Liseden mezun olmak üzere olan iki yakın arkadaş, bir partiye içki sokmak için komik ve çılgın maceralara atılır.',
    poster_path: '/ek8e8GhOp5f4705m9G8VqR3b7nL.jpg',
    backdrop_path: '/3Yp2bVzYQf8m47V1N7rP8Q5k4M.jpg',
    vote_average: 7.2,
    release_date: '2007-08-17',
    genre_ids: [35],
  },
  {
    id: 120467,
    title: 'Büyük Budapeşte Oteli',
    original_title: 'The Grand Budapest Hotel',
    overview: 'İki savaş arası dönemde ünlü bir Avrupa otelinin efsanevi konsiyerji ve onun güvenilir dostu komi çırağının maceraları.',
    poster_path: '/eWdyYQreja6JGCzqHWX9ne8rNrm.jpg',
    backdrop_path: '/vL5LR6WdxWPkWG83Yv3Wb7yR1g.jpg',
    vote_average: 8.0,
    release_date: '2014-02-26',
    genre_ids: [35, 18],
  },

  // Korku & Gerilim
  {
    id: 138843,
    title: 'Korku Seansı',
    original_title: 'The Conjuring',
    overview: 'Paranormal araştırmacılar Ed ve Lorraine Warren, izole bir çiftlik evinde karanlık bir varlık tarafından tehdit edilen bir aileye yardım etmeye gider.',
    poster_path: '/wVYREutTvI2tmxr6ujrHT704wGF.jpg',
    backdrop_path: '/m5O96nZAW94Z4b9b7R5M2yY7m1.jpg',
    vote_average: 7.5,
    release_date: '2013-07-18',
    genre_ids: [27, 53],
  },
  {
    id: 447332,
    title: 'Sessiz Bir Yer',
    original_title: 'A Quiet Place',
    overview: 'En ufak sese duyarlı ölümcül yaratıkların istilasındaki dünyada bir aile hayatta kalabilmek için tam bir sessizlik içinde yaşamak zorundadır.',
    poster_path: '/nAU74GmpUk7t5iklEp3bufwDq4n.jpg',
    backdrop_path: '/roYyPiQDytnk0Ag4bpQozZqE0Fq.jpg',
    vote_average: 7.4,
    release_date: '2018-04-03',
    genre_ids: [27, 878, 53],
  },
  {
    id: 419430,
    title: 'Kapan',
    original_title: 'Get Out',
    overview: 'Siyahi bir genç, beyaz kız arkadaşının ailesinin kırsaldaki malikanesine tanışmaya gittiğinde rahatsız edici olaylarla karşılaşır.',
    poster_path: '/tFXcEccSQMf3lfhfXKSU9iRBpa3.jpg',
    backdrop_path: '/vZ7EVk7FaJRm9GgZ5W3F8T9m2.jpg',
    vote_average: 7.6,
    release_date: '2017-02-24',
    genre_ids: [27, 53],
  },
  {
    id: 807,
    title: 'Yedi',
    original_title: 'Se7en',
    overview: 'İki dedektif, yedi ölümcül günahı motif olarak kullanarak cinayetler işleyen zeki bir seri katilin peşine düşer.',
    poster_path: '/69Sns8WoET6C6FL8gErG996i8pn.jpg',
    backdrop_path: '/ba4CpLmxvLWxhnVgpC9yUqyGzGk.jpg',
    vote_average: 8.4,
    release_date: '1995-09-22',
    genre_ids: [53, 18],
  },
  {
    id: 11324,
    title: 'Zindan Adası',
    original_title: 'Shutter Island',
    overview: 'İki ABD Mareşali, akıl hastası suçluların kaldığı izole bir ada hastanesinden kaybolan bir kadını ararken kendi zihinlerinin sınırlarıyla karşılaşır.',
    poster_path: '/kve20wg72v4GRnVqaENbgmRjCj3.jpg',
    backdrop_path: '/vj4F6v9Q4kXW17L4g0b6u9h6h5.jpg',
    vote_average: 8.2,
    release_date: '2010-02-14',
    genre_ids: [18, 53],
  },

  // Romantik & Duygusal
  {
    id: 597,
    title: 'Titanik',
    original_title: 'Titanic',
    overview: 'Farklı sosyal sınıflardan iki genç, batmaz denilen lüks Titanik gemisinde tanışıp aşık olurlar.',
    poster_path: '/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg',
    backdrop_path: '/yDIvIq5c32Y1xM2qM9wE0hZ9fK.jpg',
    vote_average: 7.9,
    release_date: '1997-11-18',
    genre_ids: [18, 10749],
  },
  {
    id: 313369,
    title: 'Aşıklar Şehri',
    original_title: 'La La Land',
    overview: 'Los Angeles\'ta hayallerinin peşinden koşan bir caz piyanisti ile genç bir oyuncu adayı arasındaki tutkulu ve melankolik aşk.',
    poster_path: '/uDO8zWDhfWNzuzRJIZek5X4AzGg.jpg',
    backdrop_path: '/ndLIG08k6uXq9Gf1Gf7xY9y1r4.jpg',
    vote_average: 7.9,
    release_date: '2016-11-29',
    genre_ids: [35, 18, 10749],
  },
  {
    id: 38,
    title: 'Sil Baştan',
    original_title: 'Eternal Sunshine of the Spotless Mind',
    overview: 'Ayrıldığı sevgilisinin kendisini hafızasından sildirdiğini öğrenen bir adam, aynı tıbbi işlemi yaptırmaya karar verir ama anılarını kaybetmek istemediğini fark eder.',
    poster_path: '/5MwkWH9tYHv3mV9OdYTMR5qnuq2.jpg',
    backdrop_path: '/7qT2K0F6V0s9X2Q1p7v6v0y4bF.jpg',
    vote_average: 8.1,
    release_date: '2004-03-19',
    genre_ids: [18, 878, 10749],
  },

  // Animasyon
  {
    id: 129,
    title: 'Ruhların Kaçışı',
    original_title: 'Sen to Chihiro no Kamikakushi',
    overview: 'Ailesi domuzlara dönüştürülen 10 yaşındaki Chihiro, onları kurtarmak için cadıların ve ruhların dünyasında çalışmak zorunda kalır.',
    poster_path: '/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg',
    backdrop_path: '/bXNvzjUL0EnW0qL0y5h0g1y0w.jpg',
    vote_average: 8.5,
    release_date: '2001-07-20',
    genre_ids: [16, 12, 18],
  },
  {
    id: 324857,
    title: 'Örümcek-Adam: Örümcek Evreninde',
    original_title: 'Spider-Man: Into the Spider-Verse',
    overview: 'Genç Miles Morales, farklı boyutlardan gelen diğer Örümcek kahramanlarla birleşerek tüm gerçeklikleri tehdit eden bir güce karşı savaşır.',
    poster_path: '/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg',
    backdrop_path: '/7d6f0Vv7u7T2o1Y8f4r3w1y5Q1.jpg',
    vote_average: 8.4,
    release_date: '2018-12-06',
    genre_ids: [16, 28, 878],
  },
  {
    id: 354912,
    title: 'Coco',
    original_title: 'Coco',
    overview: 'Ailesinin müzik yasağına rağmen gitarist olma hayalleri kuran genç Miguel, Ölüler Diyarı\'na büyülü bir yolculuk yapar.',
    poster_path: '/gGEsBPAijhVUFoiNpgZXqRVWJt2.jpg',
    backdrop_path: '/askg3SMvhqEl4OL52YuvdtQw40.jpg',
    vote_average: 8.2,
    release_date: '2017-10-27',
    genre_ids: [16, 12, 35],
  },

  // Suç & Epik Sinema
  {
    id: 238,
    title: 'Baba',
    original_title: 'The Godfather',
    overview: 'New York’un güçlü mafya ailesi Corleone’lerin reisi Don Vito ve ailenin başına geçmek zorunda kalan oğlu Michael’ın epik hikayesi.',
    poster_path: '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
    backdrop_path: '/tmU7GeKVybMWFButWEGl2M4GeiP.jpg',
    vote_average: 8.7,
    release_date: '1972-03-14',
    genre_ids: [18],
  },
  {
    id: 680,
    title: 'Ucuz Roman',
    original_title: 'Pulp Fiction',
    overview: 'İki tetikçi, bir boksör, bir gangster ve karısının hayatları, şiddet ve kurtuluş dolu kara mizah hikayelerinde iç içe geçer.',
    poster_path: '/d5iIlFnGhFvlMtf19P20qHNw9ef.jpg',
    backdrop_path: '/suaEOtk1916guXlZT8SrTyZm06x.jpg',
    vote_average: 8.5,
    release_date: '1994-09-10',
    genre_ids: [53],
  },
  {
    id: 475557,
    title: 'Joker',
    original_title: 'Joker',
    overview: 'Toplum tarafından dışlanan ve akıl sağlığı bozulan başarısız bir komedyen, Gotham şehrinde kanlı bir isyanın kıvılcımını yakar.',
    poster_path: '/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg',
    backdrop_path: '/f5F4cRhQdU3bu0fhPTLph2GUDfd.jpg',
    vote_average: 8.1,
    release_date: '2019-10-02',
    genre_ids: [18, 53],
  },

  // Macera & Fantastik
  {
    id: 120,
    title: 'Yüzüklerin Efendisi: Yüzük Kardeşliği',
    original_title: 'The Lord of the Rings: The Fellowship of the Ring',
    overview: 'Orta Dünya\'nın kaderi, Karanlıklar Efendisi Sauron\'un Tek Yüzüğü\'nü yok etmek için yola çıkan genç Hobbit Frodo Baggins\'in ellerindedir.',
    poster_path: '/6oom5QYQ2yQTMJIbnvbkBL9cDK6.jpg',
    backdrop_path: '/x2RS3uTcsJJ9Ifj2z8yA0y1B5Fv.jpg',
    vote_average: 8.4,
    release_date: '2001-12-18',
    genre_ids: [12, 28],
  },
  {
    id: 22,
    title: 'Karayip Korsanları: Siyah İnci\'nin Laneti',
    original_title: 'Pirates of the Caribbean: The Curse of the Black Pearl',
    overview: 'Eksantrik korsan Kaptan Jack Sparrow, lanetli yaşayan ölü korsanların çaldığı gemisini ve vali kızını kurtarmak için genç bir demirciyle anlaşır.',
    poster_path: '/z8onk7LV9MPkweKP0umBYsc57eY.jpg',
    backdrop_path: '/8q4T1q7l1wQ8b8bY1y1y1y1y1.jpg',
    vote_average: 7.8,
    release_date: '2003-07-09',
    genre_ids: [12, 28],
  },
  {
    id: 299534,
    title: 'Avengers: Endgame',
    original_title: 'Avengers: Endgame',
    overview: 'Thanos’un evrenin yarısını yok etmesinin ardından hayatta kalan Avengers ekibi, evreni eski haline getirmek için son bir mücadeleye girişir.',
    poster_path: '/or06FN3Dka5tukK1e9sl16pB3iy.jpg',
    backdrop_path: '/7RyHsO4yDXtBv1z1b0b5y1y1.jpg',
    vote_average: 8.2,
    release_date: '2019-04-24',
    genre_ids: [12, 878, 28],
  },
]

// Default blank profile
export function getDefaultTasteProfile(userId: string): TasteProfile {
  return {
    userId,
    username: 'Sinemasever',
    avatar: '🍿',
    isOnboarded: false,
    genreScores: {},
    likedMovies: [],
    watchedMovieIds: [],
    watchedMovies: [],
    passedMovieIds: [],
    totalSwipes: 0,
  }
}

// Load taste profile from localStorage
export function loadTasteProfile(userId: string): TasteProfile {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${userId}`)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<TasteProfile>
      let watchedMovies = parsed.watchedMovies || []

      // If existing profile has watchedMovieIds but empty watchedMovies, populate from COLD_START_MOVIES
      if (watchedMovies.length === 0 && parsed.watchedMovieIds && parsed.watchedMovieIds.length > 0) {
        const matchingColdStart = COLD_START_MOVIES.filter((m) =>
          parsed.watchedMovieIds?.includes(m.id)
        ).map((m) => ({
          movie: m,
          watchedAt: new Date().toISOString(),
        }))
        watchedMovies = matchingColdStart
      }

      return {
        ...getDefaultTasteProfile(userId),
        ...parsed,
        watchedMovies,
      } as TasteProfile
    }
  } catch (err) {
    console.error('Failed to load taste profile:', err)
  }
  return getDefaultTasteProfile(userId)
}

// Save taste profile to localStorage
export function saveTasteProfile(profile: TasteProfile): void {
  try {
    localStorage.setItem(`${STORAGE_KEY}_${profile.userId}`, JSON.stringify(profile))
  } catch (err) {
    console.error('Failed to save taste profile:', err)
  }
}

// Update taste matrix on user swipe action
export function updateTasteWithSwipe(
  profile: TasteProfile,
  movie: Movie,
  action: SwipeAction
): TasteProfile {
  const updatedScores = { ...profile.genreScores }
  const movieGenreIds = movie.genre_ids || []

  // Check if movie already had a previous state to adjust score delta accurately
  const wasLiked = (profile.likedMovies || []).some((m) => m.id === movie.id)
  const wasWatched = (profile.watchedMovieIds || []).includes(movie.id)
  const wasPassed = (profile.passedMovieIds || []).includes(movie.id)

  let oldDelta = 0
  if (wasLiked) oldDelta = 2
  else if (wasWatched) oldDelta = 1
  else if (wasPassed) oldDelta = -1

  const newDelta = action === 'like' ? 2 : action === 'watched' ? 1 : -1
  const netDelta = wasLiked || wasWatched || wasPassed ? newDelta - oldDelta : newDelta

  for (const gId of movieGenreIds) {
    updatedScores[gId] = (updatedScores[gId] || 0) + netDelta
  }

  // Ensure strict mutual exclusivity between liked, watched and passed lists
  let updatedLiked = [...(profile.likedMovies || [])]
  let updatedWatched = [...(profile.watchedMovieIds || [])]
  let updatedWatchedEntries = [...(profile.watchedMovies || [])]
  let updatedPassed = [...(profile.passedMovieIds || [])]

  if (action === 'like') {
    // Remove from watched and passed if present
    updatedWatched = updatedWatched.filter((id) => id !== movie.id)
    updatedWatchedEntries = updatedWatchedEntries.filter((w) => w.movie.id !== movie.id)
    updatedPassed = updatedPassed.filter((id) => id !== movie.id)
    if (!updatedLiked.some((m) => m.id === movie.id)) {
      updatedLiked.unshift(movie)
    }
  } else if (action === 'watched') {
    // Crucial: remove from liked and passed so it only remains in watched
    updatedLiked = updatedLiked.filter((m) => m.id !== movie.id)
    updatedPassed = updatedPassed.filter((id) => id !== movie.id)
    if (!updatedWatched.includes(movie.id)) {
      updatedWatched.push(movie.id)
    }
    if (!updatedWatchedEntries.some((w) => w.movie.id === movie.id)) {
      updatedWatchedEntries.unshift({
        movie,
        watchedAt: new Date().toISOString(),
      })
    }
  } else if (action === 'pass' || action === 'veto') {
    // Remove from liked and watched if changing to pass/veto
    updatedLiked = updatedLiked.filter((m) => m.id !== movie.id)
    updatedWatched = updatedWatched.filter((id) => id !== movie.id)
    updatedWatchedEntries = updatedWatchedEntries.filter((w) => w.movie.id !== movie.id)
    if (!updatedPassed.includes(movie.id)) {
      updatedPassed.push(movie.id)
    }
  }

  const updated: TasteProfile = {
    ...profile,
    genreScores: updatedScores,
    likedMovies: updatedLiked,
    watchedMovieIds: updatedWatched,
    watchedMovies: updatedWatchedEntries,
    passedMovieIds: updatedPassed,
    totalSwipes: wasLiked || wasWatched || wasPassed ? profile.totalSwipes : profile.totalSwipes + 1,
  }

  saveTasteProfile(updated)
  return updated
}

// Remove movie from liked movies list
export function removeLikedMovie(profile: TasteProfile, movieId: number): TasteProfile {
  const updatedLiked = (profile.likedMovies || []).filter((m) => m.id !== movieId)
  const updated: TasteProfile = {
    ...profile,
    likedMovies: updatedLiked,
  }
  saveTasteProfile(updated)
  return updated
}

// Mark a movie as watched, optionally with a rating (1-10)
export function markMovieAsWatched(
  profile: TasteProfile,
  movie: Movie,
  rating?: number
): TasteProfile {
  // Remove from liked if present
  const updatedLiked = (profile.likedMovies || []).filter((m) => m.id !== movie.id)
  const updatedWatchedIds = [...(profile.watchedMovieIds || [])]
  if (!updatedWatchedIds.includes(movie.id)) {
    updatedWatchedIds.push(movie.id)
  }

  const existingEntries = profile.watchedMovies || []
  const existingIndex = existingEntries.findIndex((w) => w.movie.id === movie.id)
  let updatedWatchedEntries: WatchedMovieEntry[]

  if (existingIndex >= 0) {
    updatedWatchedEntries = existingEntries.map((w, idx) =>
      idx === existingIndex
        ? { ...w, rating: rating !== undefined ? rating : w.rating, watchedAt: new Date().toISOString() }
        : w
    )
  } else {
    updatedWatchedEntries = [
      {
        movie,
        rating,
        watchedAt: new Date().toISOString(),
      },
      ...existingEntries,
    ]
  }

  // If rating is high (>= 8), give bonus to genre affinity
  const updatedScores = { ...profile.genreScores }
  if (rating && rating >= 8) {
    for (const gId of movie.genre_ids || []) {
      updatedScores[gId] = (updatedScores[gId] || 0) + 1
    }
  }

  const updated: TasteProfile = {
    ...profile,
    genreScores: updatedScores,
    likedMovies: updatedLiked,
    watchedMovieIds: updatedWatchedIds,
    watchedMovies: updatedWatchedEntries,
  }

  saveTasteProfile(updated)
  return updated
}

// Remove movie from watched list
export function removeWatchedMovie(profile: TasteProfile, movieId: number): TasteProfile {
  const updatedWatchedEntries = (profile.watchedMovies || []).filter((w) => w.movie.id !== movieId)
  const updatedWatchedIds = (profile.watchedMovieIds || []).filter((id) => id !== movieId)
  const updated: TasteProfile = {
    ...profile,
    watchedMovies: updatedWatchedEntries,
    watchedMovieIds: updatedWatchedIds,
  }
  saveTasteProfile(updated)
  return updated
}

// Move movie back from watched list to liked list
export function moveWatchedToLiked(profile: TasteProfile, movie: Movie): TasteProfile {
  const updatedWatchedEntries = (profile.watchedMovies || []).filter((w) => w.movie.id !== movie.id)
  const updatedWatchedIds = (profile.watchedMovieIds || []).filter((id) => id !== movie.id)
  const updatedLiked = [...(profile.likedMovies || [])]
  if (!updatedLiked.some((m) => m.id === movie.id)) {
    updatedLiked.unshift(movie)
  }

  const updated: TasteProfile = {
    ...profile,
    likedMovies: updatedLiked,
    watchedMovies: updatedWatchedEntries,
    watchedMovieIds: updatedWatchedIds,
  }
  saveTasteProfile(updated)
  return updated
}

// Update rating for an already watched movie
export function updateMovieRating(
  profile: TasteProfile,
  movieId: number,
  rating: number
): TasteProfile {
  const updatedWatchedEntries = (profile.watchedMovies || []).map((w) =>
    w.movie.id === movieId ? { ...w, rating } : w
  )

  const updated: TasteProfile = {
    ...profile,
    watchedMovies: updatedWatchedEntries,
  }
  saveTasteProfile(updated)
  return updated
}

// Calculate top genres with affinity percentages
export function getTopGenresWithPercentages(
  profile: TasteProfile,
  limit = 4
): { genreId: number; name: string; score: number; percentage: number }[] {
  const scores = profile.genreScores
  const scoredGenres: { genreId: number; name: string; score: number }[] = []

  for (const genre of GENRES) {
    if (genre.id === 0) continue
    const score = scores[genre.id] || 0
    if (score > 0) {
      scoredGenres.push({ genreId: genre.id, name: genre.name, score })
    }
  }

  scoredGenres.sort((a, b) => b.score - a.score)
  const top = scoredGenres.slice(0, limit)
  const maxScore = top.length > 0 ? Math.max(...top.map((t) => t.score), 1) : 1

  return top.map((t) => ({
    ...t,
    percentage: Math.min(100, Math.round((t.score / maxScore) * 100)),
  }))
}

// Extract top genre IDs for personalized querying
export function getTopGenreIds(profile: TasteProfile, count = 3): number[] {
  const top = getTopGenresWithPercentages(profile, count)
  return top.map((t) => t.genreId)
}

// Calculate combined taste between two room partners
export function getJointRoomGenres(
  user1Genres: number[],
  user2Genres?: number[]
): number[] {
  if (!user2Genres || user2Genres.length === 0) {
    return user1Genres.length > 0 ? user1Genres : [28, 878, 35] // default fallback
  }

  // Intersection: genres both users love
  const intersection = user1Genres.filter((id) => user2Genres.includes(id))
  if (intersection.length > 0) {
    return intersection
  }

  // Union if no intersection
  return Array.from(new Set([...user1Genres, ...user2Genres]))
}

// Calculate Life Counter (Total time dedicated to movies)
export function calculateLifeCounter(watchedMovies: WatchedMovieEntry[] = []): {
  days: number
  hours: number
  minutes: number
  totalMinutes: number
} {
  let totalMinutes = 0
  for (const entry of watchedMovies) {
    const runtime = entry.movie?.runtime && entry.movie.runtime > 0 ? entry.movie.runtime : 110
    totalMinutes += runtime
  }
  const days = Math.floor(totalMinutes / (24 * 60))
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60)
  const minutes = totalMinutes % 60
  return { days, hours, minutes, totalMinutes }
}

// Calculate comprehensive profile statistics
export function calculateProfileStats(profile: TasteProfile): {
  totalSwipes: number
  watchedCount: number
  likedCount: number
  passedCount: number
  likeRatio: number
  averageRating: number | null
  totalRatedCount: number
} {
  const watchedCount = (profile.watchedMovies || []).length
  const likedCount = (profile.likedMovies || []).length
  const passedCount = (profile.passedMovieIds || []).length
  const totalSwipes = profile.totalSwipes || 0

  const likeRatio = totalSwipes > 0 ? Math.round((likedCount / totalSwipes) * 100) : 0

  const ratedEntries = (profile.watchedMovies || []).filter((w) => w.rating !== undefined && w.rating > 0)
  const averageRating =
    ratedEntries.length > 0
      ? Number((ratedEntries.reduce((sum, curr) => sum + (curr.rating || 0), 0) / ratedEntries.length).toFixed(1))
      : null

  return {
    totalSwipes,
    watchedCount,
    likedCount,
    passedCount,
    likeRatio,
    averageRating,
    totalRatedCount: ratedEntries.length,
  }
}

// Calculate personalized taste affinity percentage (50% - 98%) for a movie based on user's genre scores
// Returns null if the user has liked fewer than 20 movies or has no genuine genre data
export function calculateMovieAffinity(
  genreScores: Record<number, number> = {},
  genreIds: number[] = [],
  voteAverage = 7.0,
  likedMoviesCount = 0
): number | null {
  const hasRealTasteData =
    likedMoviesCount >= 20 &&
    genreScores &&
    Object.keys(genreScores).length > 0 &&
    Object.values(genreScores).some((s) => s > 0)

  if (!hasRealTasteData || !genreIds || genreIds.length === 0) {
    return null
  }

  const allScores = Object.values(genreScores)
  const maxScore = Math.max(...allScores, 1)

  let movieScore = 0
  for (const gId of genreIds) {
    const s = genreScores[gId] || 0
    movieScore += s
  }

  const avgGenreScore = movieScore / genreIds.length
  const ratio = Math.max(-0.5, Math.min(1.5, avgGenreScore / maxScore))

  const basePercent = 65 + ratio * 24 + (voteAverage - 6.5) * 2.5
  return Math.min(98, Math.max(50, Math.round(basePercent)))
}

// Calculate couple taste compatibility score (30% - 99%)
export function calculateCoupleCompatibility(
  myScores: Record<number, number> = {},
  partnerScores?: Record<number, number> | null
): number | null {
  if (!partnerScores || Object.keys(partnerScores).length === 0) {
    return null
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0
  const allGenreIds = new Set([...Object.keys(myScores), ...Object.keys(partnerScores)].map(Number))

  for (const gId of allGenreIds) {
    const a = myScores[gId] || 0
    const b = partnerScores[gId] || 0
    dotProduct += a * b
    normA += a * a
    normB += b * b
  }

  if (normA === 0 || normB === 0) return null
  const cosine = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  return Math.min(99, Math.max(30, Math.round(30 + cosine * 68)))
}

// Add a matched movie to history archive
export function addMatchedMovie(
  profile: TasteProfile,
  movie: Movie,
  roomCode?: string,
  partnerName?: string
): TasteProfile {
  const existingHistory = profile.matchHistory || []
  if (existingHistory.some((item) => item.movie.id === movie.id)) {
    return profile
  }

  const newEntry: MatchedMovieEntry = {
    movie,
    matchedAt: new Date().toISOString(),
    roomCode,
    partnerName,
  }

  const updated: TasteProfile = {
    ...profile,
    matchHistory: [newEntry, ...existingHistory],
  }
  saveTasteProfile(updated)
  return updated
}

// Update rating for an entry in match history archive
export function updateMatchRating(
  profile: TasteProfile,
  movieId: number,
  myRating: number
): TasteProfile {
  const existingHistory = profile.matchHistory || []
  const updatedHistory = existingHistory.map((item) =>
    item.movie.id === movieId ? { ...item, myRating } : item
  )

  const updated: TasteProfile = {
    ...profile,
    matchHistory: updatedHistory,
  }
  saveTasteProfile(updated)
  return updated
}
