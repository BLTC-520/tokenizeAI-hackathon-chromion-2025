## 🧱 1. Token Creation 
* **Problem**: New token is being created, but the **bundle name remains the same** (e.g., `Bundle-1` for all).
* **Root cause**:   The problem is that processNextToken() is using a stale closure of currentStepIndex. When we call processNextToken() after updating currentStepIndex, it's still using the old value.

* **Solution**:  
*   1. Removed the direct processNextToken() call after setCurrentStepIndex()
    2. Added a useEffect that triggers when currentStepIndex changes
    3. This ensures processNextToken() always uses the current value of currentStepIndex

**Fix**:
Step 1:
Update src/app/components/TransactionProgress.tsx with 4 additions and 3 removals
       114          // Move to next token or complete
       115          setTimeout(() => {
       116            if (!isCancelled && currentStepIndex + 1 < bundle.tokens.length) {
       117 -            console.log(`🔄 Moving to next token: ${currentStepIndex + 1} → ${currentStepIndex + 2}`);
       118 -            setCurrentStepIndex(currentStepIndex + 1);
       119 -            processNextToken();
       117 +            const nextIndex = currentStepIndex + 1;
       118 +            console.log(`🔄 Moving to next token: ${currentStepIndex + 1} → ${nextIndex + 1}`);
       119 +            setCurrentStepIndex(nextIndex);
       120 +            // Don't call processNextToken() here - let the useEffect handle it
       121            } else if (!isCancelled) {
       122              console.log(`🎉 All ${bundle.tokens.length} tokens completed!`);
       123              // All tokens completed

Step 2:
add a useEffect to handle the currentStepIndex change: Update src/app/components/TransactionProgress.tsx with 8 additions:
       74      }, [steps]);
       75
       76 +    // Process next token when currentStepIndex changes
       77 +    useEffect(() => {
       78 +      if (currentStepIndex > 0 && currentStepIndex < bundle.tokens.length && !isCancelled) {
       79 +        console.log(`🔄 currentStepIndex changed to ${currentStepIndex}, processing next token...`);
       80 +        processNextToken();
       81 +      }
       82 +    }, [currentStepIndex]);
       83 +  
       84      // Handle transaction state changes
       85      useEffect(() => {
       86        if (txHash && currentStepIndex < steps.length) {

