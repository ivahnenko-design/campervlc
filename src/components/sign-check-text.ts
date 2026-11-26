// Texts of the signing page for document recognition and the data checks
// (shared/sign-rules.js), in the 7 languages of the site.

type Lang = "es" | "en" | "ru" | "uk" | "de" | "it" | "nl";

export interface CheckTexts {
  bSinceLabel: string;
  bSinceHint: string;
  reading: string;
  filled: string;
  unread: string;
  warnings: Record<"name_mismatch" | "birth_mismatch" | "mrz_unreadable", string>;
  rules: Record<
    | "age_under_25"
    | "license_too_new"
    | "license_expired"
    | "doc_expired"
    | "date_future"
    | "date_order"
    | "doc_number_invalid"
    | "phone_invalid",
    string
  >;
  fixFields: string;
  contact: string;
}

export const CHECK_TEXT: Record<Lang, CheckTexts> = {
  en: {
    bSinceLabel: "Category B held since",
    bSinceHint: "Back of the licence, table of categories: row B, column 10.",
    reading: "Reading your documents...",
    filled: "We filled in the fields from your document photos. Please check them and correct anything that is wrong.",
    unread: "We could not read the photos. Please fill in the fields yourself.",
    warnings: {
      name_mismatch: "The surname on your ID and on your licence do not match. Make sure both documents belong to the same person.",
      birth_mismatch: "The date of birth on your ID and on your licence do not match.",
      mrz_unreadable: "The code lines of your document could not be checked. Please check the document number carefully.",
    },
    rules: {
      age_under_25: "Under the contract, drivers must be at least 25 on the pickup day.",
      license_too_new: "Category B must have been held for at least 2 years on the pickup day (insurance condition).",
      license_expired: "The licence must be valid until the return day.",
      doc_expired: "The document must be valid until the return day.",
      date_future: "This date cannot be in the future.",
      date_order: "Check this date: it does not match the other dates.",
      doc_number_invalid: "This DNI/NIE number fails the check letter test. Please check it.",
      phone_invalid: "Enter the phone in international format, e.g. +34 600 000 000.",
    },
    fixFields: "Please correct the fields marked in red.",
    contact: "If you think this is a mistake, write to us on WhatsApp +34 624 038 085.",
  },
  es: {
    bSinceLabel: "Clase B obtenida en",
    bSinceHint: "Reverso del permiso, tabla de clases: fila B, columna 10.",
    reading: "Leyendo tus documentos...",
    filled: "Hemos rellenado los campos con las fotos de tus documentos. Revísalos y corrige lo que no esté bien.",
    unread: "No hemos podido leer las fotos. Rellena los campos a mano.",
    warnings: {
      name_mismatch: "El apellido del documento de identidad y el del permiso no coinciden. Comprueba que ambos documentos son de la misma persona.",
      birth_mismatch: "La fecha de nacimiento del documento de identidad y la del permiso no coinciden.",
      mrz_unreadable: "No se han podido comprobar las líneas de código del documento. Revisa bien el número.",
    },
    rules: {
      age_under_25: "Según el contrato, el conductor debe tener al menos 25 años el día de la recogida.",
      license_too_new: "La clase B debe tener al menos 2 años de antigüedad el día de la recogida (condición del seguro).",
      license_expired: "El permiso debe estar en vigor hasta el día de la devolución.",
      doc_expired: "El documento debe estar en vigor hasta el día de la devolución.",
      date_future: "Esta fecha no puede ser futura.",
      date_order: "Revisa esta fecha: no cuadra con las demás.",
      doc_number_invalid: "La letra de control de este DNI/NIE no es correcta. Revísalo.",
      phone_invalid: "Indica el teléfono en formato internacional, p. ej. +34 600 000 000.",
    },
    fixFields: "Corrige los campos marcados en rojo.",
    contact: "Si crees que es un error, escríbenos por WhatsApp al +34 624 038 085.",
  },
  ru: {
    bSinceLabel: "Категория B получена",
    bSinceHint: "Оборот прав, таблица категорий: строка B, колонка 10.",
    reading: "Распознаём ваши документы...",
    filled: "Мы заполнили поля по фото документов. Проверьте их и исправьте, если что-то не так.",
    unread: "Не удалось распознать фото. Заполните поля вручную.",
    warnings: {
      name_mismatch: "Фамилия в документе и в правах не совпадает. Проверьте, что это документы одного человека.",
      birth_mismatch: "Дата рождения в документе и в правах не совпадает.",
      mrz_unreadable: "Не удалось проверить кодовые строки документа. Внимательно проверьте номер.",
    },
    rules: {
      age_under_25: "По договору водителю должно быть не меньше 25 лет на день получения автодома.",
      license_too_new: "Категория B должна быть получена не менее чем за 2 года до получения автодома (условие страховки).",
      license_expired: "Права должны действовать до дня возврата автодома.",
      doc_expired: "Документ должен действовать до дня возврата автодома.",
      date_future: "Эта дата не может быть в будущем.",
      date_order: "Проверьте дату: она не согласуется с другими датами.",
      doc_number_invalid: "Номер DNI/NIE не проходит проверку контрольной буквы. Проверьте его.",
      phone_invalid: "Укажите телефон в международном формате, например +34 600 000 000.",
    },
    fixFields: "Исправьте поля, отмеченные красным.",
    contact: "Если вы считаете, что это ошибка, напишите нам в WhatsApp +34 624 038 085.",
  },
  uk: {
    bSinceLabel: "Категорію B отримано",
    bSinceHint: "Зворот посвідчення, таблиця категорій: рядок B, колонка 10.",
    reading: "Розпізнаємо ваші документи...",
    filled: "Ми заповнили поля за фото документів. Перевірте їх і виправте, якщо щось не так.",
    unread: "Не вдалося розпізнати фото. Заповніть поля вручну.",
    warnings: {
      name_mismatch: "Прізвище в документі та в посвідченні не збігається. Перевірте, що це документи однієї людини.",
      birth_mismatch: "Дата народження в документі та в посвідченні не збігається.",
      mrz_unreadable: "Не вдалося перевірити кодові рядки документа. Уважно перевірте номер.",
    },
    rules: {
      age_under_25: "За договором водієві має бути не менше 25 років на день отримання автобудинку.",
      license_too_new: "Категорію B має бути отримано не менше ніж за 2 роки до отримання автобудинку (умова страховки).",
      license_expired: "Посвідчення має діяти до дня повернення автобудинку.",
      doc_expired: "Документ має діяти до дня повернення автобудинку.",
      date_future: "Ця дата не може бути в майбутньому.",
      date_order: "Перевірте дату: вона не узгоджується з іншими датами.",
      doc_number_invalid: "Номер DNI/NIE не проходить перевірку контрольної літери. Перевірте його.",
      phone_invalid: "Вкажіть телефон у міжнародному форматі, наприклад +34 600 000 000.",
    },
    fixFields: "Виправте поля, позначені червоним.",
    contact: "Якщо ви вважаєте, що це помилка, напишіть нам у WhatsApp +34 624 038 085.",
  },
  de: {
    bSinceLabel: "Klasse B erteilt am",
    bSinceHint: "Rückseite des Führerscheins, Klassentabelle: Zeile B, Spalte 10.",
    reading: "Deine Dokumente werden gelesen...",
    filled: "Wir haben die Felder anhand deiner Dokumentfotos ausgefüllt. Bitte prüfe sie und korrigiere, was nicht stimmt.",
    unread: "Die Fotos konnten nicht gelesen werden. Bitte fülle die Felder selbst aus.",
    warnings: {
      name_mismatch: "Der Nachname im Ausweis und im Führerschein stimmt nicht überein. Prüfe, ob beide Dokumente derselben Person gehören.",
      birth_mismatch: "Das Geburtsdatum im Ausweis und im Führerschein stimmt nicht überein.",
      mrz_unreadable: "Die Codezeilen des Dokuments konnten nicht geprüft werden. Bitte prüfe die Dokumentnummer genau.",
    },
    rules: {
      age_under_25: "Laut Vertrag müssen Fahrer am Abholtag mindestens 25 Jahre alt sein.",
      license_too_new: "Die Klasse B muss am Abholtag seit mindestens 2 Jahren bestehen (Versicherungsbedingung).",
      license_expired: "Der Führerschein muss bis zum Rückgabetag gültig sein.",
      doc_expired: "Das Dokument muss bis zum Rückgabetag gültig sein.",
      date_future: "Dieses Datum darf nicht in der Zukunft liegen.",
      date_order: "Prüfe dieses Datum: Es passt nicht zu den anderen Daten.",
      doc_number_invalid: "Diese DNI/NIE-Nummer besteht die Prüfbuchstaben-Kontrolle nicht. Bitte prüfe sie.",
      phone_invalid: "Gib die Telefonnummer im internationalen Format an, z. B. +34 600 000 000.",
    },
    fixFields: "Bitte korrigiere die rot markierten Felder.",
    contact: "Wenn du denkst, dass das ein Fehler ist, schreib uns per WhatsApp an +34 624 038 085.",
  },
  it: {
    bSinceLabel: "Categoria B conseguita il",
    bSinceHint: "Retro della patente, tabella delle categorie: riga B, colonna 10.",
    reading: "Stiamo leggendo i tuoi documenti...",
    filled: "Abbiamo compilato i campi dalle foto dei documenti. Controllali e correggi ciò che non è giusto.",
    unread: "Non siamo riusciti a leggere le foto. Compila i campi a mano.",
    warnings: {
      name_mismatch: "Il cognome sul documento d'identità e sulla patente non coincide. Verifica che i documenti siano della stessa persona.",
      birth_mismatch: "La data di nascita sul documento d'identità e sulla patente non coincide.",
      mrz_unreadable: "Non è stato possibile verificare le righe di codice del documento. Controlla bene il numero.",
    },
    rules: {
      age_under_25: "Secondo il contratto, il conducente deve avere almeno 25 anni il giorno del ritiro.",
      license_too_new: "La categoria B deve essere conseguita da almeno 2 anni il giorno del ritiro (condizione dell'assicurazione).",
      license_expired: "La patente deve essere valida fino al giorno della riconsegna.",
      doc_expired: "Il documento deve essere valido fino al giorno della riconsegna.",
      date_future: "Questa data non può essere nel futuro.",
      date_order: "Controlla questa data: non è coerente con le altre.",
      doc_number_invalid: "La lettera di controllo di questo DNI/NIE non è corretta. Controllalo.",
      phone_invalid: "Indica il telefono in formato internazionale, ad es. +34 600 000 000.",
    },
    fixFields: "Correggi i campi segnati in rosso.",
    contact: "Se pensi che sia un errore, scrivici su WhatsApp al +34 624 038 085.",
  },
  nl: {
    bSinceLabel: "Categorie B behaald op",
    bSinceHint: "Achterkant van het rijbewijs, tabel met categorieën: rij B, kolom 10.",
    reading: "We lezen je documenten...",
    filled: "We hebben de velden ingevuld op basis van de foto's van je documenten. Controleer ze en corrigeer wat niet klopt.",
    unread: "We konden de foto's niet lezen. Vul de velden zelf in.",
    warnings: {
      name_mismatch: "De achternaam op je identiteitsbewijs en op je rijbewijs komen niet overeen. Controleer of beide documenten van dezelfde persoon zijn.",
      birth_mismatch: "De geboortedatum op je identiteitsbewijs en op je rijbewijs komen niet overeen.",
      mrz_unreadable: "De codelijnen van het document konden niet worden gecontroleerd. Controleer het documentnummer goed.",
    },
    rules: {
      age_under_25: "Volgens het contract moeten bestuurders op de ophaaldag minstens 25 jaar zijn.",
      license_too_new: "Categorie B moet op de ophaaldag minstens 2 jaar in bezit zijn (voorwaarde van de verzekering).",
      license_expired: "Het rijbewijs moet geldig zijn tot de dag van inleveren.",
      doc_expired: "Het document moet geldig zijn tot de dag van inleveren.",
      date_future: "Deze datum kan niet in de toekomst liggen.",
      date_order: "Controleer deze datum: hij past niet bij de andere data.",
      doc_number_invalid: "De controleletter van dit DNI/NIE-nummer klopt niet. Controleer het.",
      phone_invalid: "Vul het telefoonnummer in internationaal formaat in, bijv. +34 600 000 000.",
    },
    fixFields: "Corrigeer de rood gemarkeerde velden.",
    contact: "Denk je dat dit een fout is, stuur ons dan een WhatsApp op +34 624 038 085.",
  },
};
