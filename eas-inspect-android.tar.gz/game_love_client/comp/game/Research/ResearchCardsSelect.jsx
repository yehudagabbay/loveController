import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CustomAlert from '../../../assets/utils/CustomAlert';
import { getResearchCards } from '../../../assets/utils/ApiTools';
import { useLanguage } from '../../../src/localization/LanguageContext';

const STEPS = [
  'סוג משחק',
  'בחירת ספר',
  'סגנון משחק',
  'בחירת רמות',
  'סיכום והתחלת משחק',
];

const BOOKS = [
  {
    id: 'seven-principles',
    bookId: 1,
    title: 'The Seven Principles for Making Marriage Work',
    description: 'שיחה זוגית, אמון וקרבה.',
    coverImage: require('../../../assets/images/books/seven-principles.jpg'),
  },
  {
    id: 'supercommunicators',
    bookId: 2,
    title: 'Supercommunicators',
    description: 'הקשבה, חיבור ושיחה עמוקה.',
    coverImage: require('../../../assets/images/books/supercommunicators.jpg'),
  },
  {
    id: 'art-of-gathering',
    bookId: 3,
    title: 'The Art of Gathering',
    description: 'מפגשים משמעותיים יותר.',
    coverImage: require('../../../assets/images/books/art-of-gathering.jpg'),
  },
  {
    id: 'mars-venus',
    bookId: 4,
    title: 'Men Are From Mars and Women Are From Venus',
    description: 'תקשורת, צרכים וציפיות.',
    coverImage: require('../../../assets/images/books/mars-venus.jpg'),
  },
  {
    id: 'come-as-you-are',
    bookId: 10,
    title: 'Come As You Are',
    description: 'אינטימיות, ביטחון ותשוקה.',
    coverImage: require('../../../assets/images/books/come-as-you-are.jpeg'),
  },
  {
    id: 'love-languages',
    bookId: 20,
    title: 'The Five Love Languages',
    description: 'איך מרגישים ומראים אהבה.',
    coverImage: require('../../../assets/images/books/love-languages.jpg'),
  },
];

const BOOK_GALLERY_LOOPS = 7;
const BOOK_GALLERY_MIDDLE_LOOP = Math.floor(BOOK_GALLERY_LOOPS / 2);

const GAME_TYPES = [
  {
    id: 'couple',
    modeId: 1,
    title: 'זוגות',
    description: 'כרטיסים לזוגיות, שיחה, קרבה ותשוקה.',
    routeName: 'IndexGame',
    players: ['שחקן 1', 'שחקן 2'],
    styles: [
      {
        id: 'fun',
        title: 'כיף',
        description: 'שאלות ומשימות קלילות לפתיחה וצחוק.',
        categoryId: 2,
        subCategoryIds: [1, 2, 3],
      },
      {
        id: 'intro',
        title: 'היכרות',
        description: 'שיחה אישית, זיכרונות וערכים.',
        categoryId: 1,
        subCategoryIds: [1, 2, 3],
      },
      {
        id: 'passion',
        title: 'תשוקה',
        description: 'קרבה, רצון ואינטימיות בצורה נעימה.',
        categoryId: 3,
        subCategoryIds: [1, 2, 3],
      },
    ],
  },
  {
    id: 'family',
    modeId: 3,
    title: 'משפחה',
    description: 'כרטיסים למשפחה, צחוק וסיפורים משותפים.',
    routeName: 'FamilyCardsGame',
    players: ['משתתף 1', 'משתתף 2'],
    styles: [
      {
        id: 'family-stories',
        title: 'סיפורים משפחתיים',
        description: 'זיכרונות, מסורת ורגעים שנשארים.',
        categoryId: 1,
        subCategoryIds: [1, 2, 3],
      },
      {
        id: 'family-fun',
        title: 'צחוק ומשחק',
        description: 'כרטיסים קלילים שמתאימים לכולם.',
        categoryId: 2,
        subCategoryIds: [1, 2, 3],
      },
      {
        id: 'family-closeness',
        title: 'קרבה והקשבה',
        description: 'הערכה, שיתוף ושיחה בטוחה.',
        categoryId: 3,
        subCategoryIds: [1, 2, 3],
      },
    ],
  },
  {
    id: 'friends',
    modeId: 2,
    title: 'חברים',
    description: 'כרטיסים לחברים, עבודה, אמון ואתגר.',
    routeName: 'FriendsCardsGame',
    players: ['משתתף 1', 'משתתף 2'],
    styles: [
      {
        id: 'friends-intro',
        title: 'היכרות ופתיחה',
        description: 'פותחים שיחה ומחברים את הקבוצה.',
        categoryId: 1,
        subCategoryIds: [1, 2, 3],
      },
      {
        id: 'friends-fun',
        title: 'כיף ואתגרים',
        description: 'צחוק, משימות וסיטואציות מפתיעות.',
        categoryId: 2,
        subCategoryIds: [1, 2, 3],
      },
      {
        id: 'friends-trust',
        title: 'אמון ועומק',
        description: 'פרגון, הקשבה ושיחה אמיתית.',
        categoryId: 3,
        subCategoryIds: [1, 2, 3],
      },
    ],
  },
];

const LEVEL_OPTIONS = [
  { value: 1, label: '1', description: 'עדין' },
  { value: 2, label: '2', description: 'קל' },
  { value: 3, label: '3', description: 'מאוזן' },
  { value: 4, label: '4', description: 'עמוק' },
  { value: 5, label: '5', description: 'ישיר' },
];

const getById = (items, id) => items.find((item) => item.id === id) || null;

const mapScaleLevelToServerLevel = (level) => {
  const numericLevel = Number(level);
  if (numericLevel <= 2) return 1;
  if (numericLevel === 3) return 2;
  return 3;
};

export default function ResearchCardsSelect({ navigation, route }) {
  const { lang } = useLanguage();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const rowWidth = Math.min(520, Math.max(280, Math.round(width - 32)));
  const bookCardWidth = Math.min(270, Math.max(220, Math.round(rowWidth * 0.72)));
  const bookItemGap = 12;
  const bookItemStep = bookCardWidth + bookItemGap;
  const bookLoopWidth = BOOKS.length * bookItemStep;
  const bookLoopStartOffset = bookLoopWidth * BOOK_GALLERY_MIDDLE_LOOP;
  const bookGalleryRef = useRef(null);
  const bookScrollXRef = useRef(bookLoopStartOffset);
  const bookAutoPausedRef = useRef(false);
  const bookResumeTimerRef = useRef(null);

  const [userId, setUserId] = useState(route?.params?.userId ?? null);
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedGameTypeId, setSelectedGameTypeId] = useState('');
  const [selectedBookId, setSelectedBookId] = useState('');
  const [selectedStyleIds, setSelectedStyleIds] = useState([]);
  const [styleLevels, setStyleLevels] = useState({});
  const [busy, setBusy] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const loopedBooks = useMemo(
    () =>
      Array.from({ length: BOOK_GALLERY_LOOPS }).flatMap((_, loopIndex) =>
        BOOKS.map((book) => ({
          ...book,
          loopKey: `${loopIndex}-${book.id}`,
        })),
      ),
    [],
  );

  useEffect(() => {
    (async () => {
      if (!userId) {
        const saved = await SecureStore.getItemAsync('lg_userId');
        if (saved) setUserId(saved);
      }
    })();
  }, [userId]);

  useEffect(() => {
    if (stepIndex !== 1 || bookLoopWidth <= 0) {
      return undefined;
    }

    bookScrollXRef.current = bookLoopStartOffset;
    bookAutoPausedRef.current = false;

    const startTimer = setTimeout(() => {
      bookGalleryRef.current?.scrollTo({ x: bookLoopStartOffset, animated: false });
    }, 80);

    const autoTimer = setInterval(() => {
      if (bookAutoPausedRef.current) {
        return;
      }

      let nextX = bookScrollXRef.current + 0.55;

      if (nextX >= bookLoopWidth * (BOOK_GALLERY_LOOPS - 2)) {
        nextX -= bookLoopWidth * BOOK_GALLERY_MIDDLE_LOOP;
      }

      bookScrollXRef.current = nextX;
      bookGalleryRef.current?.scrollTo({ x: nextX, animated: false });
    }, 40);

    return () => {
      clearTimeout(startTimer);
      clearInterval(autoTimer);
      if (bookResumeTimerRef.current) {
        clearTimeout(bookResumeTimerRef.current);
        bookResumeTimerRef.current = null;
      }
    };
  }, [bookLoopStartOffset, bookLoopWidth, stepIndex]);

  const selectedGameType = getById(GAME_TYPES, selectedGameTypeId);
  const selectedBook = getById(BOOKS, selectedBookId);
  const selectedStyles = useMemo(
    () =>
      selectedGameType
        ? selectedStyleIds
            .map((styleId) => getById(selectedGameType.styles, styleId))
            .filter(Boolean)
        : [],
    [selectedGameType, selectedStyleIds],
  );

  const allLevelsSelected =
    selectedStyles.length > 0 &&
    selectedStyles.every((style) => Boolean(styleLevels[style.id]));

  const selections = useMemo(() => {
    if (!selectedGameType || !selectedBook || !allLevelsSelected) {
      return [];
    }

    return selectedStyles.flatMap((style) =>
      style.subCategoryIds.map((subCategoryId) => ({
        ModeID: selectedGameType.modeId,
        CategoryID: style.categoryId,
        BookID: selectedBook.bookId,
        SubCategoryID: subCategoryId,
        LevelID: mapScaleLevelToServerLevel(styleLevels[style.id]),
      })),
    );
  }, [allLevelsSelected, selectedBook, selectedGameType, selectedStyles, styleLevels]);

  const showAlert = (type, title, message) => {
    setAlertConfig({ visible: true, type, title, message });
  };

  const closeAlert = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  };

  const canOpenStep = (index) => {
    if (index === 0) return true;
    if (index === 1) return Boolean(selectedGameType);
    if (index === 2) return Boolean(selectedGameType && selectedBook);
    if (index === 3) return Boolean(selectedGameType && selectedBook && selectedStyles.length);
    return Boolean(selectedGameType && selectedBook && allLevelsSelected);
  };

  const goToStep = (index) => {
    if (index < 0 || index >= STEPS.length || !canOpenStep(index)) {
      return;
    }
    setStepIndex(index);
  };

  const selectGameType = (gameTypeId) => {
    if (gameTypeId === selectedGameTypeId) {
      return;
    }

    setSelectedGameTypeId(gameTypeId);
    setSelectedBookId('');
    setSelectedStyleIds([]);
    setStyleLevels({});
  };

  const toggleStyle = (styleId) => {
    setSelectedStyleIds((current) => {
      if (current.includes(styleId)) {
        setStyleLevels((levels) => {
          const nextLevels = { ...levels };
          delete nextLevels[styleId];
          return nextLevels;
        });
        return current.filter((currentStyleId) => currentStyleId !== styleId);
      }

      return [...current, styleId];
    });
  };

  const startGame = async () => {
    if (!userId) {
      showAlert('warning', 'חסר משתמש', 'לא הצלחנו לזהות משתמש מחובר. נסו להתחבר מחדש.');
      return;
    }

    if (!selectedGameType || !selectedBook || selections.length === 0) {
      showAlert('warning', 'רק רגע', 'יש להשלים את כל שלבי הבחירה לפני התחלת המשחק.');
      return;
    }

    setBusy(true);

    try {
      const result = await getResearchCards({
        selections,
        lang,
        userId,
        maxCards: 18,
      });

      if (!result.response.ok) {
        const message =
          result.response.status === 403
            ? 'האפשרות זמינה למנויי Premium בלבד.'
            : result.response.status === 404
            ? 'לא נמצאו כרטיסי מחקר שמתאימים לבחירות האלה.'
            : result.data?.message || result.raw || 'לא הצלחנו לשלוף כרטיסי מחקר.';

        showAlert('warning', 'מחקר', message);
        return;
      }

      const cards = Array.isArray(result.data) ? result.data : [];

      if (cards.length === 0) {
        showAlert('info', 'מחקר', 'לא נמצאו כרטיסי מחקר שמתאימים לבחירות האלה.');
        return;
      }

      navigation.navigate(selectedGameType.routeName, {
        userId,
        gameMode: selectedGameType.id,
        selection: {
          research: true,
          gameType: selectedGameType.id,
          bookId: selectedBook.bookId,
          styles: selectedStyleIds,
          levels: styleLevels,
        },
        cards,
        players: selectedGameType.players,
      });
    } catch (error) {
      showAlert(
        'error',
        'שגיאת רשת',
        error?.name === 'AbortError'
          ? 'הבקשה לשרת ארכה יותר מדי זמן.'
          : error?.message || 'לא הצלחנו לשלוף כרטיסי מחקר.',
      );
    } finally {
      setBusy(false);
    }
  };

  const selectedStyleText = selectedStyles.length
    ? selectedStyles.map((style) => style.title).join(', ')
    : 'טרם נבחר';
  const selectedLevelText = selectedStyles.length
    ? selectedStyles
        .map((style) =>
          styleLevels[style.id]
            ? `${style.title} ${styleLevels[style.id]}`
            : `${style.title} טרם נבחר`,
        )
        .join(', ')
    : 'טרם נבחר';

  const progressPercent = Math.round((stepIndex / (STEPS.length - 1)) * 100);
  const completedLevelCount = selectedStyles.filter((style) => Boolean(styleLevels[style.id])).length;
  const summaryChips = [
    {
      key: 'gameType',
      label: selectedGameType?.title || 'סוג משחק',
      active: Boolean(selectedGameType),
    },
    {
      key: 'book',
      label: selectedBook ? `ספר: ${selectedBook.title}` : 'ספר',
      active: Boolean(selectedBook),
    },
    {
      key: 'styles',
      label: selectedStyles.length ? `סגנונות: ${selectedStyles.length}` : 'סגנונות',
      active: selectedStyles.length > 0,
    },
    {
      key: 'levels',
      label: allLevelsSelected
        ? 'רמות: הושלם'
        : selectedStyles.length
        ? `רמות: ${completedLevelCount}/${selectedStyles.length}`
        : 'רמות',
      active: allLevelsSelected,
    },
  ];

  const renderSummary = (summaryStyle = null) => (
    <View style={[styles.summaryBox, summaryStyle]}>
      <Text style={styles.summaryTitle}>הבחירות שלך</Text>
      <Text style={styles.summaryLine}>סוג משחק: {selectedGameType?.title || 'טרם נבחר'}</Text>
      <Text style={styles.summaryLine}>ספר: {selectedBook?.title || 'טרם נבחר'}</Text>
      <Text style={styles.summaryLine}>סגנונות: {selectedStyleText}</Text>
      <Text style={styles.summaryLine}>רמות: {selectedLevelText}</Text>
    </View>
  );

  const renderSelectionChips = (summaryStyle = null) => (
    <View style={[styles.chipSummary, summaryStyle]}>
      {summaryChips.map((chip) => (
        <View key={chip.key} style={[styles.summaryChip, chip.active && styles.summaryChipActive]}>
          <Text style={[styles.summaryChipText, chip.active && styles.summaryChipTextActive]} numberOfLines={1}>
            {chip.label}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderChoiceButton = ({ item, selected, onPress, icon }) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.choiceButton, selected && styles.choiceButtonSelected]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={[styles.choiceIcon, selected && styles.choiceIconSelected]}>
        <MaterialCommunityIcons name={icon} size={22} color={selected ? '#0F172A' : '#67E8F9'} />
      </View>
      <View style={styles.choiceTextBox}>
        <Text style={styles.choiceTitle}>{item.title}</Text>
        <Text style={styles.choiceDescription}>{item.description}</Text>
      </View>
    </TouchableOpacity>
  );

  const keepBookGalleryInLoop = (x) => {
    if (bookLoopWidth <= 0) {
      return;
    }

    const minOffset = bookLoopWidth;
    const maxOffset = bookLoopWidth * (BOOK_GALLERY_LOOPS - 2);
    let nextX = x;

    if (x < minOffset) {
      nextX = x + bookLoopWidth * BOOK_GALLERY_MIDDLE_LOOP;
    } else if (x > maxOffset) {
      nextX = x - bookLoopWidth * BOOK_GALLERY_MIDDLE_LOOP;
    }

    bookScrollXRef.current = nextX;

    if (nextX !== x) {
      bookGalleryRef.current?.scrollTo({ x: nextX, animated: false });
    }
  };

  const pauseBookGalleryAutoScroll = () => {
    bookAutoPausedRef.current = true;

    if (bookResumeTimerRef.current) {
      clearTimeout(bookResumeTimerRef.current);
      bookResumeTimerRef.current = null;
    }
  };

  const resumeBookGalleryAutoScrollSoon = () => {
    if (bookResumeTimerRef.current) {
      clearTimeout(bookResumeTimerRef.current);
    }

    bookResumeTimerRef.current = setTimeout(() => {
      bookAutoPausedRef.current = false;
      bookResumeTimerRef.current = null;
    }, 1200);
  };

  const renderStepContent = () => {
    if (stepIndex === 0) {
      return (
        <View style={[styles.stepCard, { width: rowWidth }]}>
          <Text style={styles.stepEyebrow}>שלב 1 מתוך 5</Text>
          <Text style={styles.stepTitle}>בחרו סוג משחק</Text>
          <Text style={styles.stepText}>הכרטיסים יישלפו לפי עולם המשחק שתבחרו.</Text>
          {GAME_TYPES.map((gameType) =>
            renderChoiceButton({
              item: gameType,
              selected: selectedGameTypeId === gameType.id,
              onPress: () => selectGameType(gameType.id),
              icon: gameType.id === 'couple' ? 'heart-multiple' : gameType.id === 'family' ? 'home-heart' : 'account-group',
            }),
          )}
        </View>
      );
    }

    if (stepIndex === 1) {
      return (
        <View style={[styles.stepCard, { width: rowWidth }]}>
          <Text style={styles.stepEyebrow}>שלב 2 מתוך 5</Text>
          <Text style={styles.stepTitle}>בחרו ספר</Text>
          <Text style={styles.stepText}>החליקו בין הכריכות ובחרו את הספר שממנו תרצו למשוך כרטיסים.</Text>
          <ScrollView
            ref={bookGalleryRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={bookItemStep}
            scrollEventThrottle={32}
            contentContainerStyle={styles.bookGalleryContent}
            onContentSizeChange={() => {
              if (stepIndex === 1) {
                bookScrollXRef.current = bookLoopStartOffset;
                bookGalleryRef.current?.scrollTo({ x: bookLoopStartOffset, animated: false });
              }
            }}
            onScroll={(event) => {
              keepBookGalleryInLoop(event.nativeEvent.contentOffset.x);
            }}
            onScrollBeginDrag={pauseBookGalleryAutoScroll}
            onMomentumScrollBegin={pauseBookGalleryAutoScroll}
            onScrollEndDrag={resumeBookGalleryAutoScrollSoon}
            onMomentumScrollEnd={(event) => {
              keepBookGalleryInLoop(event.nativeEvent.contentOffset.x);
              resumeBookGalleryAutoScrollSoon();
            }}
          >
            {loopedBooks.map((book) => {
              const isSelected = selectedBookId === book.id;

              return (
                <TouchableOpacity
                  key={book.loopKey}
                  style={[styles.bookCard, { width: bookCardWidth }, isSelected && styles.bookCardSelected]}
                  activeOpacity={0.88}
                  onPress={() => setSelectedBookId(book.id)}
                >
                  <View style={styles.bookCoverWrap}>
                    <Image source={book.coverImage} style={styles.bookCover} resizeMode="cover" />
                    {isSelected ? (
                      <View style={styles.bookSelectedBadge}>
                        <MaterialCommunityIcons name="check" size={18} color="#0F172A" />
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.bookCopy}>
                    <Text style={styles.bookTitle} numberOfLines={2}>
                      {book.title}
                    </Text>
                    <Text style={styles.bookDescription} numberOfLines={2}>
                      {book.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      );
    }

    if (stepIndex === 2) {
      return (
        <View style={[styles.stepCard, { width: rowWidth }]}>
          <Text style={styles.stepEyebrow}>שלב 3 מתוך 5</Text>
          <Text style={styles.stepTitle}>בחרו סגנון משחק</Text>
          <Text style={styles.stepText}>אפשר לבחור סגנון אחד או כמה סגנונות.</Text>
          {selectedGameType?.styles.map((style) =>
            renderChoiceButton({
              item: style,
              selected: selectedStyleIds.includes(style.id),
              onPress: () => toggleStyle(style.id),
              icon: 'cards-heart',
            }),
          )}
        </View>
      );
    }

    if (stepIndex === 3) {
      return (
        <View style={[styles.stepCard, { width: rowWidth }]}>
          <Text style={styles.stepEyebrow}>שלב 4 מתוך 5</Text>
          <Text style={styles.stepTitle}>בחרו רמה לכל סגנון</Text>
          <Text style={styles.stepText}>בחרו כמה עדינה או עמוקה תהיה כל חוויה.</Text>
          {selectedStyles.map((style) => {
            const selectedLevel = styleLevels[style.id];

            return (
              <View key={style.id} style={styles.levelCard}>
                <View style={styles.levelHeader}>
                  <Text style={styles.levelTitle}>{style.title}</Text>
                  <Text style={styles.selectedLevelText}>
                    {selectedLevel ? `רמה ${selectedLevel}` : 'בחרו רמה'}
                  </Text>
                </View>
                <View style={styles.levelRow}>
                  {LEVEL_OPTIONS.map((level) => {
                    const isSelected = selectedLevel === level.value;
                    return (
                      <TouchableOpacity
                        key={level.value}
                        style={[styles.levelButton, isSelected && styles.levelButtonSelected]}
                        activeOpacity={0.85}
                        onPress={() =>
                          setStyleLevels((current) => ({
                            ...current,
                            [style.id]: level.value,
                          }))
                        }
                      >
                        <Text style={[styles.levelNumber, isSelected && styles.levelTextSelected]}>
                          {level.label}
                        </Text>
                        <Text style={[styles.levelDescription, isSelected && styles.levelTextSelected]}>
                          {level.description}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      );
    }

    return (
      <View style={[styles.stepCard, { width: rowWidth }]}>
        <Text style={styles.stepEyebrow}>שלב 5 מתוך 5</Text>
        <Text style={styles.stepTitle}>סיכום והתחלת משחק</Text>
        <Text style={styles.stepText}>לאחר הלחיצה נשלוף את כרטיסי המחקר ונעבור למסך המשחק הרגיל.</Text>
        {renderSummary()}
        <View style={styles.serverSummary}>
          {selectedStyles.map((style) => (
            <Text key={style.id} style={styles.serverSummaryChip}>
              {style.title}: רמה {styleLevels[style.id]}
            </Text>
          ))}
        </View>
        <View style={styles.summaryActions}>
          <TouchableOpacity style={styles.secondaryAction} onPress={() => goToStep(3)}>
            <Text style={styles.secondaryActionText}>חזרה לעריכה</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.primaryAction, busy && styles.primaryActionDisabled]} onPress={startGame} disabled={busy}>
            {busy ? <ActivityIndicator color="#0F172A" /> : <Text style={styles.primaryActionText}>התחל משחק</Text>}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={closeAlert}
      />

      <LinearGradient colors={['#0F172A', '#111827', '#172554']} style={StyleSheet.absoluteFill} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 18,
            paddingBottom: Math.max(insets.bottom + 32, 52),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.topBar, { width: rowWidth }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <MaterialCommunityIcons name="arrow-right" size={20} color="#E5E7EB" />
            <Text style={styles.backButtonText}>חזרה</Text>
          </TouchableOpacity>
          <View style={styles.premiumBadge}>
            <MaterialCommunityIcons name="crown" size={16} color="#FDE68A" />
            <Text style={styles.premiumBadgeText}>Premium</Text>
          </View>
        </View>

        <View style={[styles.header, { width: rowWidth }]}>
          <Text style={styles.headerKicker}>LIBA</Text>
          <Text style={styles.headerTitle}>מחקר</Text>
          <Text style={styles.headerSubtitle}>בחירת כרטיסים מבוססי ספרים שהוכנו מראש בשרת.</Text>
        </View>

        <View style={[styles.progressCard, { width: rowWidth }]}>
          <View style={styles.progressHeader}>
            <View style={styles.progressTitleBox}>
              <Text style={styles.progressStepCounter}>שלב {stepIndex + 1} מתוך {STEPS.length}</Text>
              <Text style={styles.progressTitle}>{STEPS[stepIndex]}</Text>
            </View>
            <Text style={styles.progressPercent}>{progressPercent}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>

        {stepIndex < 4 ? renderSelectionChips({ width: rowWidth }) : null}

        {renderStepContent()}

        {stepIndex < 4 ? (
          <View style={[styles.footerActions, { width: rowWidth }]}>
            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={() => (stepIndex === 0 ? navigation.goBack() : goToStep(stepIndex - 1))}
            >
              <Text style={styles.secondaryActionText}>חזרה</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryAction, !canOpenStep(stepIndex + 1) && styles.primaryActionDisabled]}
              disabled={!canOpenStep(stepIndex + 1)}
              onPress={() => goToStep(stepIndex + 1)}
            >
              <Text style={styles.primaryActionText}>המשך</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  backButton: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 21,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  backButtonText: {
    color: '#E5E7EB',
    fontWeight: '800',
    fontSize: 14,
  },
  premiumBadge: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 21,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(253,230,138,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(253,230,138,0.25)',
  },
  premiumBadgeText: {
    color: '#FDE68A',
    fontWeight: '900',
  },
  header: {
    alignItems: 'center',
    marginBottom: 14,
  },
  headerKicker: {
    color: '#67E8F9',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 6,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '900',
    textAlign: 'center',
  },
  headerSubtitle: {
    color: '#CBD5E1',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 8,
  },
  progressCard: {
    padding: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    marginBottom: 10,
  },
  progressHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  progressTitleBox: {
    flex: 1,
    alignItems: 'flex-end',
  },
  progressStepCounter: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'right',
    marginBottom: 2,
  },
  progressTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'right',
  },
  progressPercent: {
    color: '#67E8F9',
    fontSize: 16,
    fontWeight: '900',
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginTop: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#67E8F9',
  },
  chipSummary: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  summaryChip: {
    maxWidth: '48%',
    minHeight: 34,
    justifyContent: 'center',
    borderRadius: 17,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(15,23,42,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  summaryChipActive: {
    backgroundColor: 'rgba(103,232,249,0.18)',
    borderColor: 'rgba(103,232,249,0.42)',
  },
  summaryChipText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'right',
  },
  summaryChipTextActive: {
    color: '#FFFFFF',
  },
  summaryBox: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(15,23,42,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginBottom: 12,
  },
  summaryTitle: {
    color: '#FDE68A',
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'right',
    marginBottom: 6,
  },
  summaryLine: {
    color: '#E5E7EB',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'right',
  },
  stepCard: {
    padding: 16,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.96)',
    marginBottom: 16,
  },
  stepEyebrow: {
    color: '#0891B2',
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'right',
    marginBottom: 6,
  },
  stepTitle: {
    color: '#111827',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'right',
  },
  stepText: {
    color: '#4B5563',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'right',
    marginTop: 6,
    marginBottom: 14,
  },
  choiceButton: {
    minHeight: 84,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  choiceButtonSelected: {
    backgroundColor: '#ECFEFF',
    borderColor: '#06B6D4',
  },
  choiceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
  },
  choiceIconSelected: {
    backgroundColor: '#67E8F9',
  },
  choiceTextBox: {
    flex: 1,
  },
  choiceTitle: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'right',
  },
  choiceDescription: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'right',
    marginTop: 2,
  },
  bookGalleryContent: {
    flexDirection: 'row-reverse',
    gap: 12,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  bookCard: {
    minHeight: 310,
    borderRadius: 20,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bookCardSelected: {
    backgroundColor: '#ECFEFF',
    borderColor: '#06B6D4',
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  bookCoverWrap: {
    position: 'relative',
    alignSelf: 'center',
    width: '68%',
    aspectRatio: 2 / 3,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  bookCover: {
    width: '100%',
    height: '100%',
  },
  bookSelectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#67E8F9',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  bookCopy: {
    flex: 1,
    justifyContent: 'flex-start',
    marginTop: 12,
  },
  bookTitle: {
    color: '#111827',
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '900',
    textAlign: 'right',
  },
  bookDescription: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    textAlign: 'right',
    marginTop: 5,
  },
  levelCard: {
    padding: 12,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  levelHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  levelTitle: {
    flex: 1,
    color: '#111827',
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'right',
  },
  selectedLevelText: {
    color: '#0891B2',
    fontSize: 12,
    fontWeight: '900',
  },
  levelRow: {
    flexDirection: 'row',
    gap: 6,
  },
  levelButton: {
    flex: 1,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 4,
  },
  levelButtonSelected: {
    backgroundColor: '#67E8F9',
    borderColor: '#06B6D4',
  },
  levelNumber: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '900',
  },
  levelDescription: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
    textAlign: 'center',
  },
  levelTextSelected: {
    color: '#0F172A',
  },
  serverSummary: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  serverSummaryChip: {
    overflow: 'hidden',
    color: '#0F172A',
    backgroundColor: '#FEF3C7',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: '900',
  },
  summaryActions: {
    flexDirection: 'row',
    gap: 10,
  },
  footerActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  primaryAction: {
    flex: 1,
    minHeight: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#67E8F9',
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryActionDisabled: {
    opacity: 0.45,
    shadowOpacity: 0,
  },
  primaryActionText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
  },
  secondaryAction: {
    flex: 1,
    minHeight: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#334155',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  secondaryActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
});
