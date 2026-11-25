import React, { useState } from 'react';
import { calculateDiscountAmount, useRewards } from '../hooks/RewardsContext.jsx';
import UseRewardsModal from './UseRewardsModal.jsx';

const money = amount => `$${Number(amount).toFixed(2)}`;

export default function KioskTicket({
  order,
  toppings = [],
  onCheckout,
  onEdit,
  onUpgradeDrinksToLarge,
  submitting,
  isHighContrast,
}) {
  const { user, selectedDiscounts, usedPoints } = useRewards();
  const [rewardsModalOpen, setRewardsModalOpen] = useState(false);

  const itemsWithUnitPrice = order.items.map(item => ({
    ...item,
    unitPrice: order.unitPrice(item),
  }));

  const discountAmount = user
    ? Math.min(order.subtotal, calculateDiscountAmount(itemsWithUnitPrice, selectedDiscounts, toppings))
    : 0;
  const rawTotal = order.subtotal + order.tax;
  const finalTotal = Math.max(0, Math.round((rawTotal - discountAmount) * 100) / 100);

  function handleUpgradeDrinks(unitIds = []) {
    if (typeof onUpgradeDrinksToLarge === 'function') {
      onUpgradeDrinksToLarge(unitIds);
      return;
    }

    if (!Array.isArray(unitIds) || unitIds.length === 0) return;

    const upgradeCountByKey = new Map();
    for (const unitId of unitIds) {
      const sepIdx = String(unitId).lastIndexOf('::');
      const itemKey = sepIdx !== -1 ? String(unitId).slice(0, sepIdx) : String(unitId);
      upgradeCountByKey.set(itemKey, (upgradeCountByKey.get(itemKey) || 0) + 1);
    }

    for (const [itemKey, countToUpgrade] of upgradeCountByKey.entries()) {
      const targetItem = order.items.find(it => it.key === itemKey);
      if (!targetItem || targetItem.size === 'L') continue;

      const qty = Math.max(1, Number(targetItem.quantity) || 1);
      const upgradeQty = Math.min(qty, countToUpgrade);
      const remainingMediumQty = qty - upgradeQty;

      // Build drink & selection objects compatible with both 1-arg and 2-arg useKioskOrder signatures
      const drinkObj = {
        itemid: targetItem.drinkId,
        item_name: targetItem.drinkName,
        item_cost: targetItem.basePrice,
      };

      const makePayload = (nextSize, nextQty) => ({
        ...drinkObj,
        drinkId: targetItem.drinkId,
        drinkName: targetItem.drinkName,
        basePrice: targetItem.basePrice,
        size: nextSize,
        toppingIds: targetItem.toppingIds || [],
        toppingNames: targetItem.toppingNames || [],
        toppingsPrice: targetItem.toppingsPrice || 0,
        quantity: nextQty,
      });

      const callEdit = (key, payload) => {
        if (order.edit.length >= 2) {
          order.edit(key, payload);
        } else {
          order.edit(key, payload);
        }
      };

      if (remainingMediumQty === 0) {
        callEdit(targetItem.key, makePayload('L', qty));
      } else {
        callEdit(targetItem.key, makePayload('M', remainingMediumQty));
        order.add(makePayload('L', upgradeQty));
      }
    }
  }

  return (
    <aside aria-label="Current order ticket" className="pg-ticket" style={isHighContrast ? { backgroundColor: '#1e003a', border: '4px solid #ffffff' } : {}}>
      <p className="pg-eyebrow" style={isHighContrast ? { color: '#ffb3df', fontWeight: '900' } : {}}>YOUR ORDER</p>
      <h2 style={isHighContrast ? { color: '#ffffff', fontWeight: '900' } : {}}>Current ticket</h2>

      <div className="pg-ticket-items">
        {order.items.length === 0 ? (
          <div className="pg-empty">
            <img src="/pearl-garden-cup.png" alt="" aria-hidden="true" />
            <strong style={isHighContrast ? { color: '#ffffff', fontWeight: '900' } : {}}>Your order is empty</strong>
            <span style={isHighContrast ? { color: '#ffffff', fontWeight: '700' } : {}}>Select a drink to get started!</span>
          </div>
        ) : order.items.map(item => (
          <div className="pg-ticket-item pg-ticket-item-neat" key={item.key}>
            <div className="pg-ticket-item-heading">
              <strong title={item.drinkName} style={isHighContrast ? { color: '#ffffff', fontWeight: '900' } : {}}>{item.drinkName}</strong>
              <button
                type="button"
                className="pg-edit-button"
                title="Edit drink"
                style={isHighContrast ? { border: '2px solid #ffffff', color: '#ffffff', backgroundColor: '#120024' } : {}}
                aria-label={`Edit ${item.drinkName}`}
                onClick={() => onEdit(item)}
              >✎</button>
            </div>

            {/* Structurally split the string into distinct fields for independent color targets */}
            <small className="pg-ticket-item-detail" style={{ display: 'block' }}>
              <span className="pg-item-size" style={isHighContrast ? { color: '#ffffff', fontWeight: '800' } : {}}>
                {item.size === 'M' ? 'Medium' : 'Large (+$0.50)'}
              </span>
              {item.toppingNames?.length > 0 && (
                <>
                  <span className="pg-item-divider" style={isHighContrast ? { color: '#ffffff' } : {}}> · </span>
                  <span className="pg-item-toppings" style={isHighContrast ? { color: '#ffb3df', fontWeight: '800' } : {}}>
                    {item.toppingNames.join(', ')}
                  </span>
                </>
              )}
            </small>

            <div className="pg-ticket-item-bottom">
              <strong className="pg-ticket-line-price" style={isHighContrast ? { color: '#ffb3df', fontWeight: '900' } : {}}>
                {money(order.unitPrice(item) * item.quantity)}
              </strong>
              <div className="pg-ticket-actions">
                <button style={isHighContrast ? { border: '2px solid #ffffff', color: '#ffffff' } : {}} type="button" aria-label={`Decrease ${item.drinkName}`} onClick={() => order.changeQuantity(item.key, -1)}>−</button>
                <span style={isHighContrast ? { color: '#ffffff', fontWeight: '900' } : {}}>{item.quantity}</span>
                <button style={isHighContrast ? { border: '2px solid #ffffff', color: '#ffffff' } : {}} type="button" aria-label={`Increase ${item.drinkName}`} onClick={() => order.changeQuantity(item.key, 1)}>+</button>
                <button style={isHighContrast ? { border: '2px solid #ffffff', color: '#ffffff' } : {}} type="button" aria-label={`Remove ${item.drinkName}`} onClick={() => order.remove(item.key)}>×</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pg-totals" style={isHighContrast ? { borderTop: '3px solid #ffffff', paddingTop: '12px' } : {}}>
        <div><span style={isHighContrast ? { color: '#ffffff' } : {}}>Subtotal</span><strong style={isHighContrast ? { color: '#ffffff' } : {}}>{money(order.subtotal)}</strong></div>
        <div><span style={isHighContrast ? { color: '#ffffff' } : {}}>Tax (8.25%)</span><strong style={isHighContrast ? { color: '#ffffff' } : {}}>{money(order.tax)}</strong></div>
        {user && discountAmount > 0 && (
          <div className="pg-rewards-discount-row">
            <span style={isHighContrast ? { color: '#ffb3df', fontWeight: '800' } : {}}>
              Rewards Discount ({usedPoints} pts)
            </span>
            <strong style={isHighContrast ? { color: '#ffb3df', fontWeight: '900' } : {}}>
              −{money(discountAmount)}
            </strong>
          </div>
        )}
        <div className="pg-grand-total">
          <span style={isHighContrast ? { color: '#ffffff' } : {}}>Total Before Tip</span>
          <strong style={isHighContrast ? { color: '#ffb3df', fontSize: '1.4rem' } : {}}>{money(finalTotal)}</strong>
        </div>
      </div>

      {user && (
        <button
          className="pg-use-rewards-btn"
          type="button"
          disabled={!order.items.length || submitting}
          style={isHighContrast ? { backgroundColor: '#120024', color: '#ffb3df', border: '3px solid #ffb3df', fontWeight: '900' } : {}}
          onClick={() => setRewardsModalOpen(true)}
        >
          {usedPoints > 0 ? `Use Rewards (${usedPoints} pts selected)` : 'Use Rewards'}
        </button>
      )}

      <button className="pg-primary" type="button" disabled={!order.items.length || submitting} style={isHighContrast ? { backgroundColor: '#ffffff', color: '#120024', border: '3px solid #ffb3df', fontWeight: '950', fontSize: '1.2rem' } : {}} onClick={onCheckout}>
        {submitting ? 'Processing…' : 'Checkout'}
      </button>

      <UseRewardsModal
        isOpen={rewardsModalOpen}
        onClose={() => setRewardsModalOpen(false)}
        isHighContrast={isHighContrast}
        order={order}
        onUpgradeDrinksToLarge={handleUpgradeDrinks}
      />
    </aside>
  );
}
