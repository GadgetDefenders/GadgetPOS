const TAB_ID = 'gadgetpos-pos-tabs';

type PosTab = 'Repairs' | 'Products' | 'Cell Phones' | 'Accessories' | 'Prepaid Service' | 'Miscellaneous' | 'Bill Payments';

const tabs: PosTab[] = ['Repairs','Products','Cell Phones','Accessories','Prepaid Service','Miscellaneous','Bill Payments'];

function buttonMatches(button: HTMLButtonElement, tab: PosTab): boolean {
  const text = button.innerText.toLowerCase();
  if (tab === 'Repairs') return false;
  if (tab === 'Cell Phones') return text.includes('phone');
  if (tab === 'Accessories') return text.includes('accessory');
  if (tab === 'Prepaid Service') return text.includes('prepaid');
  if (tab === 'Products') return text.includes('accessory') || text.includes('repair part');
  if (tab === 'Miscellaneous') return text.includes('repair part');
  return false;
}

function enhancePos(): void {
  const heading = Array.from(document.querySelectorAll('h2')).find(el => el.textContent?.includes('Quick Sale & Checkout'));
  if (!heading) return;
  const panel = heading.closest('.pos-catalog') as HTMLElement | null;
  if (!panel || panel.querySelector(`#${TAB_ID}`)) return;

  const inventoryHeading = Array.from(panel.querySelectorAll('h3')).find(el => el.textContent?.trim() === 'Inventory') as HTMLElement | undefined;
  const repairHeading = Array.from(panel.querySelectorAll('h3')).find(el => el.textContent?.trim() === 'Open Repairs') as HTMLElement | undefined;
  const inventoryList = inventoryHeading?.nextElementSibling as HTMLElement | null;
  const repairList = repairHeading?.nextElementSibling as HTMLElement | null;
  if (!inventoryList || !repairList) return;

  const nav = document.createElement('div');
  nav.id = TAB_ID;
  nav.className = 'pos-category-tabs';

  const empty = document.createElement('div');
  empty.className = 'pos-tab-empty';
  empty.textContent = 'No items are set up in this category yet.';
  empty.hidden = true;
  panel.insertBefore(empty, inventoryHeading);

  function activate(tab: PosTab): void {
    nav.querySelectorAll('button').forEach(button => button.classList.toggle('active', button.textContent === tab));
    const showRepairs = tab === 'Repairs';
    repairHeading!.hidden = !showRepairs;
    repairList.hidden = !showRepairs;
    inventoryHeading!.hidden = showRepairs || tab === 'Bill Payments';
    inventoryList.hidden = showRepairs || tab === 'Bill Payments';
    let visible = 0;
    inventoryList.querySelectorAll<HTMLButtonElement>(':scope > button').forEach(button => {
      const show = !showRepairs && tab !== 'Bill Payments' && buttonMatches(button, tab);
      button.hidden = !show;
      if (show) visible += 1;
    });
    empty.hidden = showRepairs || visible > 0;
    if (tab === 'Bill Payments') {
      empty.hidden = false;
      empty.innerHTML = '<strong>Bill Payments</strong><span>Add carriers and payment products here as we connect prepaid service.</span>';
    } else {
      empty.textContent = 'No items are set up in this category yet.';
    }
  }

  tabs.forEach(tab => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = tab;
    button.addEventListener('click', () => activate(tab));
    nav.appendChild(button);
  });

  panel.insertBefore(nav, panel.firstChild);
  activate('Repairs');
}

const observer = new MutationObserver(enhancePos);
observer.observe(document.documentElement, {subtree:true, childList:true});
window.addEventListener('DOMContentLoaded', enhancePos);
