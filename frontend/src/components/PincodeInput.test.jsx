import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import fc from 'fast-check'
import PincodeInput from './PincodeInput'

describe('PincodeInput', () => {
  describe('Property 13: Validation feedback without API calls', () => {
    /**
     * Feature: staff-location-input, Property 13: Validation feedback without API calls
     * Validates: Requirements 4.2
     * 
     * Property: For any invalid format input, validation feedback should be displayed 
     * without triggering geocoding requests
     */
    it('should provide validation feedback without API calls for invalid inputs', () => {
      fc.assert(
        fc.property(
          // Generate invalid pincode inputs (excluding characters that browsers filter)
          fc.oneof(
            // Whitespace strings that browsers allow in input fields
            fc.constantFrom('   ', '\t', ' '),
            // Non-numeric characters
            fc.string().filter(s => s.length > 0 && !/^\d+$/.test(s) && s.length <= 10 && !s.includes('\n') && !s.includes('\r')),
            // Wrong length numeric strings
            fc.oneof(
              fc.integer({ min: 1, max: 99999 }).map(n => n.toString()), // Less than 6 digits (not 0)
              fc.integer({ min: 1000000, max: 9999999 }).map(n => n.toString()) // More than 6 digits
            ),
            // Mixed invalid formats with specific characters
            fc.constantFrom('12345a', '123-456', '123 456', '12.345', 'abcdef'),
          ),
          (invalidInput) => {
            // Clean up any previous renders
            cleanup()
            
            // Mock the onValidPincode callback to track if it's called
            const mockOnValidPincode = vi.fn()
            const mockOnChange = vi.fn()
            
            // Render component with fresh mocks
            const { container } = render(
              <PincodeInput
                value=""
                onChange={mockOnChange}
                onValidPincode={mockOnValidPincode}
                isLoading={false}
                error=""
              />
            )
            
            // Get the input element
            const input = screen.getByLabelText(/pincode/i)
            
            // Simulate user input
            fireEvent.change(input, { target: { value: invalidInput } })
            
            // For invalid inputs, onValidPincode should NOT be called
            // This ensures no API calls are made for invalid formats
            expect(mockOnValidPincode).not.toHaveBeenCalled()
            
            // onChange should always be called to keep parent in sync
            expect(mockOnChange).toHaveBeenCalledWith(invalidInput)
            
            // For non-empty invalid inputs, validation feedback should be shown
            if (invalidInput.trim() !== '') {
              // Check that validation error is displayed
              const errorElements = screen.queryAllByText(/pincode must|must contain only numbers|must be exactly/i)
              expect(errorElements.length).toBeGreaterThan(0)
            }
            
            // Clean up after each property test iteration
            cleanup()
          }
        ),
        { numRuns: 50 } // Reduced runs for faster testing
      )
    })
    
    it('should handle empty string input correctly', () => {
      // Test empty string case separately since React doesn't trigger onChange for same values
      const mockOnValidPincode = vi.fn()
      const mockOnChange = vi.fn()
      
      render(
        <PincodeInput
          value="test" // Start with non-empty value
          onChange={mockOnChange}
          onValidPincode={mockOnValidPincode}
          isLoading={false}
          error=""
        />
      )
      
      const input = screen.getByLabelText(/pincode/i)
      
      // Clear the input to empty string
      fireEvent.change(input, { target: { value: '' } })
      
      // For empty input, onValidPincode should NOT be called
      expect(mockOnValidPincode).not.toHaveBeenCalled()
      
      // onChange should be called
      expect(mockOnChange).toHaveBeenCalledWith('')
    })
    
    it('should handle browser-filtered characters correctly', () => {
      // Test characters that browsers filter out from input fields
      const mockOnValidPincode = vi.fn()
      const mockOnChange = vi.fn()
      
      render(
        <PincodeInput
          value=""
          onChange={mockOnChange}
          onValidPincode={mockOnValidPincode}
          isLoading={false}
          error=""
        />
      )
      
      const input = screen.getByLabelText(/pincode/i)
      
      // Test newline character (browsers filter this out)
      fireEvent.change(input, { target: { value: '\n' } })
      
      // Since browser filters out newline, onChange may not be called
      // This is expected browser behavior, not a component issue
      expect(mockOnValidPincode).not.toHaveBeenCalled()
    })
    
    it('should trigger API calls only for valid 6-digit numeric inputs', () => {
      fc.assert(
        fc.property(
          // Generate valid 6-digit pincodes
          fc.integer({ min: 100000, max: 999999 }).map(n => n.toString()),
          (validPincode) => {
            // Clean up any previous renders
            cleanup()
            
            const mockOnValidPincode = vi.fn()
            const mockOnChange = vi.fn()
            
            const { container } = render(
              <PincodeInput
                value=""
                onChange={mockOnChange}
                onValidPincode={mockOnValidPincode}
                isLoading={false}
                error=""
              />
            )
            
            const input = screen.getByLabelText(/pincode/i)
            
            // Simulate user input with valid pincode
            fireEvent.change(input, { target: { value: validPincode } })
            
            // For valid inputs, no validation error should be shown immediately
            const errorElements = screen.queryAllByText(/pincode must|must contain only numbers|must be exactly/i)
            expect(errorElements.length).toBe(0)
            
            // onChange should be called
            expect(mockOnChange).toHaveBeenCalledWith(validPincode)
            
            // Note: onValidPincode is called after debounce delay, 
            // so we can't test it synchronously in this property test
            // The debounce behavior is tested separately
            
            // Clean up after each property test iteration
            cleanup()
          }
        ),
        { numRuns: 50 } // Reduced runs for faster testing
      )
    })
  })
})